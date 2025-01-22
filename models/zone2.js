const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
  zone: { type: String, required: true },
  couvPrev: { type: Number, required: true },
  couvReal: { type: Number, required: true },
  percentageCouvPrev: { type: Number, required: true },
  percentageCouvReal: { type: Number, required: true },
});

const SessionSchema = new mongoose.Schema({
  entries: [EntrySchema], // Array of entries for the session
  createdAt: { type: Date, default: Date.now }, // Timestamp for the save
});

module.exports = mongoose.model('zone2', SessionSchema);
