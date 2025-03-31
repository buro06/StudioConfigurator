//Update Network Logo from API
fetch('/api/public')
    .then(response => response.json())
    .then(data => {
        if (data.networkBugUrl) {
            document.getElementById('network-logo').src = data.networkBugUrl;
        }
    })
    .catch(error => {
        console.error('Error fetching network logo from API', error);
    });

let currentIndex = 0;
let previousIndex = null;
const scoresContainer = document.getElementById('scoresContainer');
const sportNameContainer = document.getElementById('sportNameContainer');
let gamesData = []; // Store the current games data
let isRotating = false; // Flag to track if rotation is in progress

// Load data from sports JSON
function loadScoresData() {    
    fetch('/data/sports.json')
        .then(response => response.json())
        .then(data => {
            gamesData = data.games; // Store the games data
            initializeTicker(data);
        })
        .catch(error => {
            console.error('Error loading scores data:', error);
        });
}

// Initialize the ticker with the game data
function initializeTicker(data) {
    // Clear existing content
    scoresContainer.innerHTML = '';
    sportNameContainer.innerHTML = '';

    const games = data.games;

    // Create sport name elements
    games.forEach((game, index) => {
        const sportNameElement = document.createElement('div');
        sportNameElement.className = 'sport-name';
        sportNameElement.textContent = game.sportName || "SPORT";

        if (index === 0) {
            sportNameElement.classList.add('active');
        }

        sportNameContainer.appendChild(sportNameElement);
    });

    // Create score items
    games.forEach((game, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';
        if (index === 0) {
            scoreItem.classList.add('active');
        }

        // Determine game status styling and display
        let statusClass = '';
        let statusDisplay = game.status || "LIVE";

        if (game.status === "FINAL") {
            statusClass = 'status-final';
        } else if (game.status === "UPCOMING") {
            statusClass = 'status-upcoming';
        } else {
            statusClass = 'status-live';
        }

        // Create game info HTML
        let gameInfoHTML = `
            <div class="game-info">
                <div class="team">
                    <div class="team-name">${game.awayTeam}</div>
                    <div class="score">${game.awayScore}</div>
                </div>
                <div class="vs">@</div>
                <div class="team">
                    <div class="team-name">${game.homeTeam}</div>
                    <div class="score">${game.homeScore}</div>
                </div>`;
                
        // Add game day and time for upcoming games
        if (game.status === "UPCOMING") {
            gameInfoHTML += `<div class="game-schedule">`;
            
            if (game.gameDay) {
                gameInfoHTML += `<div class="game-day">${game.gameDay}</div>`;
            }
            
            if (game.gameTime) {
                gameInfoHTML += `<div class="game-time">${game.gameTime}</div>`;
            }
            
            gameInfoHTML += `</div>`;
        }
        
        // Add game date for final games
        if (game.status === "FINAL" && game.gameDate) {
            gameInfoHTML += `<div class="game-date">${game.gameDate}</div>`;
        }
        
        // Add status display
        gameInfoHTML += `<div class="game-status ${statusClass}">${statusDisplay}</div>
            </div>`;

        scoreItem.innerHTML = gameInfoHTML;
        scoresContainer.appendChild(scoreItem);
    });

    // Start rotation if not already running
    if (!window.rotationInterval) {
        window.rotationInterval = setInterval(rotateScores, 10000);
    }

    // Set up data refresh every minute
    if (!window.refreshInterval) {
        window.refreshInterval = setInterval(() => {
            console.log('Updating scores');
            // Only refresh if not currently animating
            if (!isRotating) {
                refreshScoresData();
            } else {
                console.log("Ticker is currently animating. Will wait.")
            }
        }, 15000);
    }
}

// Refresh scores data
function refreshScoresData() {
    fetch('/data/sports.json')
        .then(response => response.json())
        .then(data => {
            // Check if data has actually changed
            if (JSON.stringify(data.games) !== JSON.stringify(gamesData)) {
                window.location.reload();
            } else {
                console.log("Scores on server match what is loaded. Skipping.")
            }
        })
        .catch(error => {
            console.error('Error refreshing scores data:', error);
        });
}

// Function to rotate through the scores
function rotateScores() {
    isRotating = true;
    
    const scoreItems = document.querySelectorAll('.score-item');
    const sportNames = document.querySelectorAll('.sport-name');

    // If there are no items, exit the function
    if (scoreItems.length === 0 || sportNames.length === 0) {
        isRotating = false;
        return;
    }

    // Reset any items that should no longer have classes
    scoreItems.forEach((item, i) => {
        if (i !== currentIndex && i !== previousIndex) {
            item.classList.remove('active', 'prev');
            item.style.transform = '';
        }
    });
    
    sportNames.forEach((item, i) => {
        if (i !== currentIndex && i !== previousIndex) {
            item.classList.remove('active', 'prev');
            item.style.transform = '';
        }
    });

    // Move current active item to prev position
    if (previousIndex !== null) {
        scoreItems[previousIndex].classList.remove('prev');
        sportNames[previousIndex].classList.remove('prev');
    }
    
    // Set current item to slide up and out
    previousIndex = currentIndex;
    scoreItems[currentIndex].classList.add('prev');
    scoreItems[currentIndex].classList.remove('active');
    sportNames[currentIndex].classList.add('prev');
    sportNames[currentIndex].classList.remove('active');

    // Move to the next item
    currentIndex = (currentIndex + 1) % scoreItems.length;

    // Position next item to slide up into view
    scoreItems[currentIndex].classList.remove('prev');
    scoreItems[currentIndex].classList.add('active');
    sportNames[currentIndex].classList.remove('prev');
    sportNames[currentIndex].classList.add('active');
    
    // Clean up after animation finished
    setTimeout(() => {
        // Remove classes and reset positions for items no longer in view
        if (previousIndex !== null && previousIndex !== currentIndex) {
            scoreItems[previousIndex].classList.remove('active', 'prev');
            sportNames[previousIndex].classList.remove('active', 'prev');
            // Reset position
            scoreItems[previousIndex].style.transform = '';
            sportNames[previousIndex].style.transform = '';
        }
        isRotating = false;
    }, 1000); // Slightly longer than the transition time
}

// Start the ticker when the page loads
window.onload = loadScoresData;

// Clean up intervals when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.rotationInterval) {
        clearInterval(window.rotationInterval);
    }
    if (window.refreshInterval) {
        clearInterval(window.refreshInterval);
    }
});