const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/UsersRoutes'); 
const coverageRoutes = require('./routes/CouverageRoutes'); 


const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/formData', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});



app.use('/api/users', userRoutes);
app.use('/api/coverage', coverageRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
