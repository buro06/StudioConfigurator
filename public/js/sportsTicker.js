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
const scoresContainer = document.getElementById('scoresContainer');
const sportNameContainer = document.getElementById('sportNameContainer');

//Load data from sports JSON
function loadScoresData() {    
    fetch('/data/sports.json')
        .then(response => response.json())
        .then(data => {
            initializeTicker(data);
        })
        .catch(error => {
            console.error('Error loading scores data:', error);
        });
}

// Initialize the ticker with the game data
function initializeTicker(data) {
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

        scoreItem.innerHTML = `
            <div class="game-info">
                <div class="team">
                    <div class="team-name">${game.awayTeam}</div>
                    <div class="score">${game.awayScore}</div>
                </div>
                <div class="vs">@</div>
                <div class="team">
                    <div class="team-name">${game.homeTeam}</div>
                    <div class="score">${game.homeScore}</div>
                </div>
                <div class="game-status">${game.status}</div>
            </div>
        `;

        scoresContainer.appendChild(scoreItem);
    });

    // Start the rotation
    setInterval(rotateScores, 10000);
}

// Function to rotate through the scores
function rotateScores() {
    const scoreItems = document.querySelectorAll('.score-item');
    const sportNames = document.querySelectorAll('.sport-name');

    // Remove active class from current items
    scoreItems[currentIndex].classList.remove('active');
    sportNames[currentIndex].classList.remove('active');

    // Move to the next item, loop back to beginning if at the end
    currentIndex = (currentIndex + 1) % scoreItems.length;

    // Add active class to new current items
    scoreItems[currentIndex].classList.add('active');
    sportNames[currentIndex].classList.add('active');
}

// Start the ticker when the page loads
window.onload = loadScoresData;