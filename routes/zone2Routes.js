const express = require('express');
const router = express.Router();

const Session = require('../models/zone2');

// Fetch all entries
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).exec();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Update an entry
router.put('/entries/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const session = await Session.findOne({ 'entries._id': id });
    if (!session) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = session.entries.id(id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Update entry fields
    Object.keys(updatedData).forEach(key => {
      entry[key] = updatedData[key];
    });

    await session.save();
    res.json({ message: 'Entry updated successfully', entry });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Delete an entry
router.delete('/entries/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const session = await Session.findOne({ 'entries._id': id });
    if (!session) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Remove the entry
    session.entries.id(id).remove();
    await session.save();

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

router.get('/entries', async (req, res) => {
  const { zone, weeks } = req.query;

  if (!zone || !weeks) {
    return res.status(400).json({ error: 'Zone and week are required parameters.' });
  }

  try {
    const numDocuments = parseInt(weeks, 10);

    // Fetch the latest `numDocuments` sessions for the given zone
    const sessions = await Session.find({ 'entries.zone': zone })
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .limit(numDocuments) // week to the specified number of documents
      .exec();

    if (sessions.length < 1) {
      return res.json([]);
    }

    // Reverse sessions to maintain chronological order for processing
    sessions.reverse();

    // Calculate differences between successive sessions
    const differences = [];
    for (let i = 0; i < sessions.length; i++) {
      const current = sessions[i].entries.find((entry) => entry.zone === zone);

      if (current) {
        differences.push({
          week: ` ${i}`, // Change label to reflect document number
          diffCouvPrev: current.couvPrev,
          diffCouvReal: current.couvReal,
          diffPercentageCouvPrev: current.percentageCouvPrev,
          diffPercentageCouvReal: current.percentageCouvReal,
        });
      }
    }

    res.json(differences);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});


  router.get('/sessions/latest', async (req, res) => {
    try {
      const latestSession = await Session.findOne().sort({ createdAt: -1 }); // Sort by createdAt in descending order
      if (!latestSession) {
        return res.status(404).json({ message: 'No sessions found.' });
      }
      res.json(latestSession);
    } catch (error) {
      console.error('Error fetching the latest session:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  });
router.post('/save', async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    const totalCouvPrev = data.reduce((sum, row) => sum + row.couvPrev, 0);
    const totalCouvReal = data.reduce((sum, row) => sum + row.couvReal, 0);

    const entries = data.map(row => ({
      zone: row.region,
      couvPrev: row.couvPrev,
      couvReal: row.couvReal,
      percentageCouvPrev: totalCouvPrev > 0 ? (row.couvPrev / totalCouvPrev) * 100 : 0,
      percentageCouvReal: totalCouvReal > 0 ? (row.couvReal / totalCouvReal) * 100 : 0,
    }));

    const session = new Session({ entries });
    await session.save();

    res.status(201).json({ message: 'Session saved successfully', sessionId: session._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving session' });
  }
});
router.delete('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findByIdAndDelete(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

router.put('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { entries } = req.body; // Array of updated entries

  try {
    // Validate that entries is an array
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Entries must be a non-empty array' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Replace the session's entries with the updated entries
    session.entries = entries;

    // Save the updated session
    await session.save();
    res.json({ message: 'Session updated successfully', session });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

router.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching session by ID:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

module.exports = router;
