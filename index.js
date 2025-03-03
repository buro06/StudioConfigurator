const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const fs = require('fs');
const session = require('express-session');
const sharedsession = require('express-socket.io-session'); // Add this package


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

// Set up session middleware
const sessionMiddleware = session({
    secret: config.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 hour
});

// Apply session middleware to Express
app.use(sessionMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Share the session with socket.io
io.use(sharedsession(sessionMiddleware, {
    autoSave: true
}));

// Authentication middleware for Express routes
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next();
    }
    console.log("AUTH: " + req.ip + " is not authenticated on " + req.path + ", prompted to login");
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
        console.log("LOGIN: " + req.ip + " logged in with " + username + ", session ID " + req.sessionID);
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        console.log("LOGIN: " + req.ip + " failed with " + username + " and " + password);
    }
});

// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        console.log("LOGOUT: " + req.sessionID + " logged out")
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
        displayName: config.displayName,
        tickerSeparator: config.tickerSeparator
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    // Check if the socket session is authenticated
    const isSocketAuthenticated = socket.handshake.session && socket.handshake.session.authenticated;

    // Log authentication status
    console.log(`Socket ${socket.id} authenticated: ${isSocketAuthenticated}`);

    // Authentication check for all socket events
    socket.use((packet, next) => {
        if (socket.handshake.session && socket.handshake.session.authenticated) {
            return next();
        }
        next(new Error('Authentication error'));
    });

    // Handle authentication errors
    socket.on('error', (err) => {
        if (err.message === 'Authentication error') {
            console.log(`AUTH ERROR: Socket ${socket.id} attempted to perform an action without authentication`);
        }
    });

    socket.on('textsData', (data, callback) => {
        console.log('Received index form data:', data);
        try {
            const textsFilePath = path.join(__dirname, 'public', 'output', 'texts.json')
            const textsDataFile = fs.readFileSync(textsFilePath, 'utf8');
            let textsJsonData = JSON.parse(textsDataFile);
            Object.keys(textsJsonData).forEach((key, index) => {
                if (data[index] !== undefined) {
                    textsJsonData[key] = data[index];
                }
            });
            fs.writeFileSync(textsFilePath, JSON.stringify(textsJsonData, null, 2), 'utf8');
            callback({ status: "success", message: 'Save successful' });
        } catch (error) {
            console.error('Error updating JSON file:', error);
            callback({ status: "error", message: error.toString() });
        }

    });

    socket.on('configData', (data, callback) => {
        console.log('Received config form data:', data);
        try {
            const configFilePath = path.join(__dirname, 'public', 'data', 'config.json')
            const configDataFile = fs.readFileSync(configFilePath, 'utf8');
            let configJsonData = JSON.parse(configDataFile);
            Object.keys(configJsonData).forEach((key, index) => {
                if (data[index] !== undefined) {
                    configJsonData[key] = data[index];
                }
            });
            fs.writeFileSync(configFilePath, JSON.stringify(configJsonData, null, 2), 'utf8');
            callback({ status: "success", message: 'Save successful' });
        } catch (error) {
            console.error('Error updating JSON file:', error);
            callback({ status: "error", message: error.toString() });
        }

    });

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