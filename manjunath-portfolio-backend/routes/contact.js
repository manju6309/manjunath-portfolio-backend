const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST /api/contact
router.post('/', async (req, res) => {
    try {
        let { name, email, subject, message } = req.body;

        // Validations - reject empty fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Unable to send message.'
            });
        }

        name = name.trim();
        email = email.trim().toLowerCase();
        subject = subject.trim();
        message = message.trim();

        if (name === '' || email === '' || subject === '' || message === '') {
            return res.status(400).json({
                success: false,
                message: 'Unable to send message.'
            });
        }

        // Email format validation regex
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Unable to send message.'
            });
        }

        // Maximum length validation to prevent spam/abuse
        if (name.length > 100 || email.length > 150 || subject.length > 200 || message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'Unable to send message.'
            });
        }

        // 1. Save message to MongoDB Atlas if connected
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            const newContact = new Contact({
                name,
                email,
                subject,
                message
            });
            await newContact.save();
            console.log('Saved contact message to MongoDB:', newContact._id);
        } else {
            console.log('MongoDB not connected. Skipping DB save (running in local mock mode).');
        }

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully!'
        });

    } catch (error) {
        console.error('Error handling contact form submission:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to send message.'
        });
    }
});

module.exports = router;
