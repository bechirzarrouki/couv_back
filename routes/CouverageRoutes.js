const express = require('express');
const router = express.Router();

const Session = require('../models/Session');

router.get('/entries', async (req, res) => {
  const { zone, weeks } = req.query;
  if (!zone || !weeks) {
    return res.status(400).json({ error: 'Zone and weeks are required parameters.' });
  }

  try {
    const numWeeks = parseInt(weeks, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numWeeks * 7);

    const sessions = await Session.find({
      'entries.zone': zone,
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: 1 })
      .exec();

    if (sessions.length < 2) {
      return res.json([]);
    }

    // Calculate differences between successive weeks
    const differences = [];
    for (let i = 1; i < sessions.length; i++) {
      const current = sessions[i].entries.find((entry) => entry.zone === zone);

      if (current) {
        differences.push({
          week: `Week ${i}`,
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


router.get('/sessions', async (req, res) => {
    try {
      const sessions = await Session.find().sort({ createdAt: -1 });
      res.status(200).json(sessions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching sessions' });
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

module.exports = router;
