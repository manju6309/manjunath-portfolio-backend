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
        const isLocalMock = !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<PASSWORD>');

        if (mongoose.connection.readyState === 1) {
            const newContact = new Contact({
                name,
                email,
                subject,
                message
            });
            await newContact.save();
            console.log('Saved contact message to MongoDB:', newContact._id);
        } else if (isLocalMock) {
            console.log('MongoDB not connected. Running in local mock mode (Simulating DB save).');
        } else {
            console.error('CRITICAL: MongoDB is not connected in production. Rejecting submission.');
            return res.status(503).json({
                success: false,
                message: 'Unable to send message.'
            });
        }

        // 2. Send email notification via Gmail if configured
        const EMAIL_USER = process.env.EMAIL_USER;
        const EMAIL_PASS = process.env.EMAIL_PASS;

        if (EMAIL_USER && EMAIL_PASS) {
            try {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: EMAIL_USER,
                        pass: EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: EMAIL_USER,
                    to: EMAIL_USER, // Send to self
                    subject: `New Portfolio Message from ${name}: ${subject}`,
                    text: `You received a new message from your portfolio contact form.\n\n` +
                          `Name: ${name}\n` +
                          `Email: ${email}\n` +
                          `Subject: ${subject}\n\n` +
                          `Message:\n${message}`
                };

                await transporter.sendMail(mailOptions);
                console.log('Email notification sent successfully.');
            } catch (mailError) {
                console.error('Failed to send email notification:', mailError.message);
                // Do not crash or block response if only mail notification fails
            }
        } else {
            console.log('Gmail SMTP email notification not configured. Skipping.');
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
