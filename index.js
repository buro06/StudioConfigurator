const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const fs = require('fs');
const session = require('express-session');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Load config, serverInfo, and package.json file
let config;
let serverInfo;
let package;
try {
    const configData = fs.readFileSync(path.join(__dirname, 'config', 'config.json'));
    package = require('./package.json');
    config = JSON.parse(configData);
} catch (error) {
    console.error('Error reading file:', error);
}

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: config.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.redirect('/login');
};

// Serve login-related static files without authentication
app.use('/css/login.css', express.static(path.join(__dirname, 'public', 'css', 'login.css')));
app.use('/js/login.js', express.static(path.join(__dirname, 'public', 'js', 'login.js')));

// Serve the login page
app.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === config.username && password === config.password) {
        req.session.authenticated = true;
        req.session.user = username;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// Protected routes below
// Root route protected by authentication
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve other static files only for authenticated users
app.use(isAuthenticated, express.static(path.join(__dirname, 'public')));

// Protected API route
app.get('/api/data', isAuthenticated, (req, res) => {
    res.json({ 
        user: req.session.user,
        version: package.version,
        subscriberImgUrl: config.subscriberImgUrl,
        displayName: config.displayName
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// Catch-all route to redirect to login for unauthenticated users
app.get('*', (req, res) => {
    res.redirect('/login');
});

// Start the server
const PORT = config.port;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});