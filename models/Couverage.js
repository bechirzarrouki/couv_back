const mongoose = require('mongoose');

const CoverageSchema = new mongoose.Schema({
  zone: { type: String, required: true },
  couvPrev: { type: Number, required: true },
  couvReal: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Coverage', CoverageSchema);
