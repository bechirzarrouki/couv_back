const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
// Fetch latest session
router.get('/sessions/latest', async (req, res) => {
  try {
    const latestSession = await Session.findOne().sort({ createdAt: -1 });
    if (!latestSession) {
      return res.status(404).json({ message: 'No sessions found.' });
    }
    res.json(latestSession);
  } catch (error) {
    console.error('Error fetching the latest session:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});
// Fetch all sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).exec();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Fetch a specific session by ID
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json(session);
  } catch (error) {
    console.error('Error fetching session by ID:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Fetch entries with zone & weeks filter
router.get('/entries', async (req, res) => {
  const { zone, weeks } = req.query;
  
  if (!zone || !weeks) {
    return res.status(400).json({ error: 'Zone and weeks are required parameters.' });
  }

  try {
    const numDocuments = parseInt(weeks, 10);

    // Fetch latest sessions matching the zone
    const sessions = await Session.find({ 'entries.zone': zone })
      .sort({ createdAt: -1 })
      .limit(numDocuments)
      .exec();

    if (sessions.length === 0) {
      return res.json([]);
    }

    // Reverse for chronological order
    sessions.reverse();

    // Extract and format data
    const differences = sessions.map((session, index) => {
      const entry = session.entries.find(e => e.zone === zone);
      return entry ? {
        week: index + 1,
        diffCouvPrev: entry.couvPrev,
        diffCouvReal: entry.couvReal,
        diffPercentageCouvPrev: entry.percentageCouvPrev,
        diffPercentageCouvReal: entry.percentageCouvReal,
      } : null;
    }).filter(entry => entry !== null);

    res.json(differences);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});



// Save a new session
router.post('/save', async (req, res) => {
  try {
    const { entries, prevuDays, realiseDays, suppDays } = req.body;

    // Validate the required fields
    if (!Array.isArray(entries) || !Array.isArray(prevuDays) || !Array.isArray(realiseDays) || !Array.isArray(suppDays)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    // Calculate total coverage for percentages
    const totalCouvPrev = entries.reduce((sum, row) => sum + row.couvPrev, 0);
    const totalCouvReal = entries.reduce((sum, row) => sum + row.couvReal, 0);
    const totalCouvSupp = entries.reduce((sum, row) => sum + row.couvSupp, 0);

    // Format entries with percentages
    const formattedEntries = entries.map(row => ({
      zone: row.zone,
      couvPrev: row.couvPrev,
      couvReal: row.couvReal,
      couvSupp: row.couvSupp,
      percentageCouvPrev: totalCouvPrev > 0 ? (row.couvPrev / totalCouvPrev) * 100 : 0,
      percentageCouvReal: totalCouvReal > 0 ? (row.couvReal / totalCouvReal) * 100 : 0,
      percentageCouvSupp: totalCouvSupp > 0 ? (row.couvSupp / totalCouvSupp) * 100 : 0,
    }));

    // Create a new session with all data
    const session = new Session({
      entries: formattedEntries,
      prevuDays,
      realiseDays,
      suppDays,
    });

    // Save the session to the database
    await session.save();
    res.status(201).json({ message: 'Session saved successfully', sessionId: session._id });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ message: 'Error saving session' });
  }
});

// Update a session
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { entries } = req.body;

    // Check if entries is an array and has the correct structure
    if (!Array.isArray(entries) || entries.length !== 3) {
      return res.status(400).json({ error: 'Entries must be an array with 3 elements: prevuData, realiseData, suppData' });
    }

    // Update the session with the new entries
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.sessionId,
      {
        prevuDays: entries[0], // First element is prevuData
        realiseDays: entries[1], // Second element is realiseData
        suppDays: entries[2], // Third element is suppData
      },
      { new: true }
    );

    // If no session is found, return a 404 error
    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Return the updated session
    res.json({ message: 'Session updated successfully', session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Update a single entry
router.put('/entries/:id', async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { 'entries._id': req.params.id },
      { $set: { 'entries.$': req.body } },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry updated successfully', session });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Delete a session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Delete an entry
router.delete('/entries/:id', async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { 'entries._id': req.params.id },
      { $pull: { entries: { _id: req.params.id } } },
      { new: true }
    );

    if (!session) return res.status(404).json({ error: 'Entry not found' });

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;
