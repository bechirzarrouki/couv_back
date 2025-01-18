const express = require('express');
const router = express.Router();
const Coverage = require('../models/Couverage');

// Save coverage data with percentage calculations for couvPrev and couvReal
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
  
      await Coverage.insertMany(entries);
  
      res.status(201).json({ message: 'Coverage data saved successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error saving coverage data' });
    }
  });
  
  // Fetch coverage data (includes percentages)
  router.get('/list', async (req, res) => {
    try {
      const coverages = await Coverage.find();
      res.status(200).json(coverages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching coverage data' });
    }
  });
  

module.exports = router;
