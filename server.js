/**
 * Christ University Student Wellness WhatsApp Bot Server
 * Developer: Gebin George (gebingeorge)
 * A comprehensive mental health support system for students
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const whatsappRoutes = require('./routes/whatsapp');
const { initializeFirebase } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/webhook', whatsappRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Christ Mental Health Support System Bot is running',
    developer: 'Gebin George',
    secretKey: process.env.SECRET_KEY || 'gebingeorge',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Christ Mental Health Support System WhatsApp Bot',
    description: 'A supportive platform for students mental wellness - Developed by Gebin George',
    version: '1.0.0',
    developer: 'Gebin George (gebingeorge)',
    university: 'Christ University',
    secretKey: process.env.SECRET_KEY || 'gebingeorge',
    features: [
      'Anonymous Complaints Integration',
      'Counselor Connections', 
      'Department Complaints with SMS to +919741301245',
      'Community Platform Integration'
    ],
    copyright: '© 2024 Gebin George - Christ University Student Wellness System'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error (Developer: Gebin George):', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'Something went wrong. Please try again later.',
    developer: 'Contact Gebin George for technical support'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint was not found.',
    developer: 'Gebin George - Christ University Student Wellness System'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Christ Mental Health Support Bot server running on port ${PORT}`);
  console.log(`📱 Webhook URL: ${process.env.NODE_ENV === 'production' ? 'https://your-render-url.onrender.com' : `http://localhost:${PORT}`}/webhook`);
  console.log(`👨‍💻 Developed by Gebin George for Christ University Student Wellness`);
});

module.exports = app; 