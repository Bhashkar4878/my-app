const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
// const path = require('path'); // No longer needed for Cloudinary
// const fs = require('fs');     // No longer needed for Cloudinary

dotenv.config();

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const messagesRoutes = require('./routes/messages');
const exploreRoutes = require('./routes/explore');
const profileRoutes = require('./routes/profile');
const translateRoutes = require('./routes/translate');
const { authenticate } = require('./middleware/auth');

const app = express();

// Allow both your local frontend AND your future deployed domain
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Important for cookies/sessions if you use them
};

app.use(cors(corsOptions));
app.use(morgan('dev'));

// Skip JSON parsing for multipart/form-data (file uploads)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next(); 
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ---------------------------------------------------------------
   REMOVED: Local Static File Serving
   ---------------------------------------------------------------
   We removed the 'uploads' directory creation logic here.
   Since we are switching to Cloudinary (or MongoDB storage), 
   we don't want to save files to the server's disk anymore.
   This fixes the "image not uploading" issue on deployment.
*/

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', authenticate, postsRoutes);
app.use('/api/messages', authenticate, messagesRoutes);
app.use('/api/explore', authenticate, exploreRoutes);
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/translate', authenticate, translateRoutes);

const PORT = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/twitterlite';

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log(`Connected to MongoDB Atlas`);
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });