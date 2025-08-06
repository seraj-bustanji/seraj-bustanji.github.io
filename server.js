const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - temporarily disable helmet for debugging
// app.use(helmet());
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:5500', 'http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many contact form submissions from this IP, please try again later.'
});
app.use('/api/contact', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('.', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Add logging for static file requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Create Nodemailer transporter with Gmail (real email delivery)
const createTransporter = async () => {
    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('📧 Using test email service (no .env file found)');
        const testAccount = await nodemailer.createTestAccount();
        console.log('📧 Test email account created:', testAccount.user);
        
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }

    console.log('📧 Using Outlook for real email delivery');
    return nodemailer.createTransport({
        service: 'outlook',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Create transporter
        const transporter = await createTransporter();

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER || transporter.options.auth.user,
            to: 'serajbustanji02@gmail.com',
            subject: `Portfolio Contact: ${subject || 'New Message from ' + name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                        New Portfolio Contact Message
                    </h2>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin-top: 0;">Contact Details:</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Subject:</strong> ${subject || 'Portfolio Contact'}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div style="background: #ffffff; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin-top: 0;">Message:</h3>
                        <p style="line-height: 1.6; color: #374151;">${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 20px;">
                        <p style="margin: 0; color: #0369a1; font-size: 14px;">
                            <strong>💼 Seraj Albustanji Portfolio</strong><br>
                            Engineering Lead & Senior Software Engineer<br>
                            Champion of the Quarter among 750+ employees
                        </p>
                    </div>
                </div>
            `,
            text: `
New Portfolio Contact Message

Contact Details:
- Name: ${name}
- Email: ${email}
- Subject: ${subject || 'Portfolio Contact'}
- Date: ${new Date().toLocaleString()}

Message:
${message}

---
Seraj Albustanji Portfolio
Engineering Lead & Senior Software Engineer
            `
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

        res.status(200).json({
            success: true,
            message: 'Message sent successfully! I\'ll get back to you soon.',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Error sending email:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Seraj Portfolio Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    console.log('Serving index.html from:', __dirname + '/index.html');
    res.sendFile(__dirname + '/index.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Seraj Portfolio Backend running on port ${PORT}`);
    console.log(`📧 Email service configured for: ${process.env.EMAIL_USER}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`💼 Portfolio: http://localhost:${PORT}`);
});

module.exports = app; 