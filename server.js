const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/formData', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const entrySchema = new mongoose.Schema({
  zone: String,
  couvrage_prevu: String,
  couvrage_realisee: String,
  createdAt: { type: Date, default: Date.now },
});

const Entry = mongoose.model('Entry', entrySchema);

// Route to save form data
app.post('/api/entries', async (req, res) => {
  const { field1, field2, field3, field4 } = req.body;
  const entry = new Entry({ field1, field2, field3, field4 });
  await entry.save();
  res.status(201).send(entry);
});

// Route to get all entries
app.get('/api/entries', async (req, res) => {
  const entries = await Entry.find();
  res.status(200).send(entries);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
