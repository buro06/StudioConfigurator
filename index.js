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

const publicPaths =
    [
        '/css/login.css',
        '/css/global.css',
        '/css/sportsTicker.css',
        '/js/login.js',
        '/js/sportsTicker.js',
        '/sports/ticker.html',
        '/favicon.ico',
        '/data/sports.json',
        '/media/networkBug.png',
        '/media/font.woff'
    ]

// Authentication middleware for Express routes
const isAuthenticated = (req, res, next) => {
    // Check if user is authenticated OR serve "public" static files without authentication
    if ((req.session && req.session.authenticated) || publicPaths.includes(req.path)) {
        return next();
    }
    console.log("AUTH: " + req.ip + " is not authenticated on " + req.path + ", prompted to login");
    res.redirect('/login');
};

// Serve sports ticker API and static files without authentication
app.get('/api/public', (req, res) => {
    res.json({
        networkBugUrl: config.networkBugUrl
    });
});

//Serve public get function api
app.get('/get', (req, res) => {
    let param = req.query.q;
    console.log("GET: " + req.ip + " retrieved " + param);
    if (param) {
        try {
            const getData = fs.readFileSync(path.join(__dirname, 'public', 'output', 'texts.json'));
            get = JSON.parse(getData);
            if (get[param] || get[param] == '') {
                if (typeof get[param] == 'boolean') return res.send(get[param]);
                res.send(get[param].replace(/\n/g, config.tickerSeparator));
            } else {
                res.send('Cannot find key with name: ' + param);
            }
        } catch (error) {
            res.send('Error reading file:' + error);
        }
    } else {
        res.send('Incorrect syntax. Read documentation');
    }
});

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

    socket.on('sportsData', (data, callback) => {
        console.log('Received sports form data:', data);
        try {
            const sportsFilePath = path.join(__dirname, 'public', 'data', 'sports.json')
            const sportsDataFile = fs.readFileSync(sportsFilePath, 'utf8');
            fs.writeFileSync(sportsFilePath, JSON.stringify(data, null, 2), 'utf8');
            callback({ status: "success", message: 'Save successful' });
        } catch (error) {
            console.error('Error updating JSON file:', error);
            callback({ status: "error", message: error.toString() });
        }

    });

    socket.on("file-upload", ({ fileName, fileData, type }, callback) => {
        var filePath;
        if (type == 'favicon') {
            filePath = path.join(__dirname, 'public', "favicon.ico");
        } else if (type == 'font') {
            filePath = path.join(__dirname, "public", 'media', 'font.woff');
        } else if (type == 'subscriberImg') {
            filePath = path.join(__dirname, "public", 'media', 'subscriberImg.png');
        } else if (type == 'networkBug') {
            filePath = path.join(__dirname, "public", 'media', 'networkBug.png');
        } else {
            return callback({ status: "error", message: "Upload type incorrect" });
        }
        console.log('UPLOAD: writing to server:', fileName);
        fs.writeFile(filePath, Buffer.from(fileData, "base64"), (err) => {
            if (err) {
                console.error("File upload failed", err);
                callback({ status: "error", message: err.toString() });
            } else {
                console.log(`File saved: ${filePath}`);
                callback({ status: "success", message: type + ' file upload successful' });
            }
        });
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