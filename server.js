const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const contactRoute = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
const allowedOrigins = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('github.io') || origin.includes('vercel.app')) {
            return callback(null, true);
        }
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true
}));

app.use(express.json());

// GET / - Status Endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Manjunath Portfolio API is running"
    });
});

app.use('/api/contact', contactRoute);

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Backend health check OK.' });
});

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI.includes('your_mongodb_connection_string') || MONGODB_URI.includes('<PASSWORD>')) {
    console.warn('WARNING: MONGODB_URI is not configured. Running server in local mock database mode.');
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Backend server (MOCK DB MODE) is listening on port ${PORT}`);
    });
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('Successfully connected to MongoDB Atlas.');
            app.listen(PORT, "0.0.0.0", () => {
                console.log(`Backend server is listening on port ${PORT}`);
            });
        })
        .catch((error) => {
            console.error('MongoDB connection error:', error.message);
            console.warn('WARNING: Running server in local mock database mode due to connection failure.');
            app.listen(PORT, "0.0.0.0", () => {
                console.log(`Backend server (MOCK DB MODE) is listening on port ${PORT}`);
            });
        });
}
