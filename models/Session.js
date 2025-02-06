const mongoose = require('mongoose');

const DayEntrySchema = new mongoose.Schema({
  day: { type: String, required: true },
  zone1: { type: String, required: false },
  zone2: { type: String, required: false },
});

const EntrySchema = new mongoose.Schema({
  zone: { type: String, required: true },
  couvPrev: { type: Number, required: true },
  couvReal: { type: Number, required: true },
  couvSupp: { type: Number, required: true },
  percentageCouvPrev: { type: Number, required: true },
  percentageCouvReal: { type: Number, required: true },
  percentageCouvSupp: { type: Number, required: true },
});

const SessionSchema = new mongoose.Schema({
  entries: [EntrySchema], // Stores the summarized regional coverage
  prevuDays: [DayEntrySchema], // Stores daily planned coverage
  realiseDays: [DayEntrySchema], // Stores daily realized coverage
  suppDays: [DayEntrySchema], // Stores daily supplementary coverage
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model('Session', SessionSchema);