const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Simple static file serving
app.use(express.static('.'));

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', files: ['index.html', 'styles.css', 'script.js'] });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🧪 Test server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
}); 