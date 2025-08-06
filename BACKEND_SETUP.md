# 🚀 Backend Setup Guide for Seraj's Portfolio

## 📋 Overview

This guide will help you set up a professional Node.js backend with Nodemailer to handle contact form submissions and send emails directly to your Gmail address.

## 🛠️ Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Gmail account
- Basic knowledge of terminal commands

## 📦 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Gmail App Password

**Important:** You need to create an "App Password" for your Gmail account, not your regular password.

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled

#### Step 2: Generate App Password
1. Go to Google Account settings
2. Navigate to "Security" → "2-Step Verification"
3. Click "App passwords" (at the bottom)
4. Select "Mail" and "Other (Custom name)"
5. Name it "Portfolio Backend"
6. Copy the generated 16-character password

### 3. Create Environment File

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Email Configuration
EMAIL_USER=serajbustanji02@gmail.com
EMAIL_PASS=your-16-character-app-password

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🚀 Running the Backend

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Check if it's working
Visit: `http://localhost:3000/api/health`

You should see:
```json
{
  "status": "OK",
  "message": "Seraj Portfolio Backend is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 📧 Testing the Contact Form

1. Start the backend: `npm run dev`
2. Open your portfolio: `http://localhost:3000`
3. Go to the Contact section
4. Fill out the form and submit
5. Check your Gmail inbox for the email

## 🔒 Security Features

The backend includes several security measures:

- **Rate Limiting**: 5 requests per 15 minutes per IP
- **Input Validation**: Email format and required fields
- **CORS Protection**: Only allows requests from specified origins
- **Helmet**: Security headers
- **Error Handling**: Proper error responses without exposing sensitive data

## 📁 File Structure

```
portfolio/
├── server.js              # Main backend server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── env.example           # Example environment file
├── index.html            # Your portfolio frontend
├── styles.css            # CSS styles
├── script.js             # Frontend JavaScript
└── BACKEND_SETUP.md      # This guide
```

## 🌐 Deployment Options

### Option 1: Heroku (Recommended for beginners)

1. Create a Heroku account
2. Install Heroku CLI
3. Create a new app:
```bash
heroku create your-portfolio-backend
```

4. Set environment variables:
```bash
heroku config:set EMAIL_USER=serajbustanji02@gmail.com
heroku config:set EMAIL_PASS=your-app-password
heroku config:set NODE_ENV=production
```

5. Deploy:
```bash
git add .
git commit -m "Add backend"
git push heroku main
```

### Option 2: Railway

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables in the dashboard
4. Deploy automatically

### Option 3: DigitalOcean/Render

Similar process to Heroku, but with their respective platforms.

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid login" error
- Make sure you're using an App Password, not your regular Gmail password
- Ensure 2-Factor Authentication is enabled
- Double-check the email address

#### 2. "Rate limit exceeded"
- Wait 15 minutes before trying again
- This is a security feature to prevent spam

#### 3. CORS errors
- Make sure the frontend is running on an allowed origin
- Check the CORS configuration in `server.js`

#### 4. Port already in use
- Change the PORT in `.env` file
- Or kill the process using the port: `lsof -ti:3000 | xargs kill`

### Debug Mode

To see detailed error messages, set:
```env
NODE_ENV=development
```

## 📊 Monitoring

The backend includes basic logging:
- Email send attempts
- Error messages
- Server startup information

Check the console output for these logs.

## 🔄 Updates

To update dependencies:
```bash
npm update
```

To check for security vulnerabilities:
```bash
npm audit
npm audit fix
```

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify your `.env` file configuration
3. Test the health endpoint: `http://localhost:3000/api/health`
4. Ensure all dependencies are installed

## 🎉 Success!

Once everything is working:
- ✅ Backend running on port 3000
- ✅ Contact form sending emails to your Gmail
- ✅ Professional email formatting
- ✅ Security features enabled
- ✅ Rate limiting protecting against spam

Your portfolio now has a professional backend that will impress potential employers! 🚀 