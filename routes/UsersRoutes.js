const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const Zone1 = require('../models/Session'); // Adjust paths to your models
const Zone2 = require('../models/zone2');
const Zone3 = require('../models/zone3');

router.post('/create', async (req, res) => {
    try {
      const { username, password, role } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ message: 'Username, password, and role are required' });
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const user = new User({ username, password, role });
      await user.save();
  
      res.status(201).json({
        message: 'User created successfully',
        user: { username, role },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating user' });
    }
  });

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful', user: { username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in' });
  }
});
router.get('/all-zones', async (req, res) => {
  try {
    // Fetch data from all collections
    const [zone1Data, zone2Data, zone3Data] = await Promise.all([
      Zone1.find(),
      Zone2.find(),
      Zone3.find(),
    ]);

    // Combine the data
    const allData = [
      ...zone1Data.map(item => ({ ...item.toObject(), zone: 'zone1' })),
      ...zone2Data.map(item => ({ ...item.toObject(), zone: 'zone2' })),
      ...zone3Data.map(item => ({ ...item.toObject(), zone: 'zone3' })),
    ];

    res.status(200).json(allData);
  } catch (error) {
    console.error('Error fetching data from zones:', error);
    res.status(500).json({ error: 'Failed to fetch data from zones' });
  }
});
module.exports = router;
