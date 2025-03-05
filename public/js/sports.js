const socket = io();

let sportsData = {
    games: []
};

// Function to render sports results table
function renderSportsResults() {
    const resultsBody = document.getElementById('sports-results-body');
    resultsBody.innerHTML = ''; // Clear existing results

    sportsData.games.forEach((game, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" name="sportName" value="${game.sportName}" data-index="${index}"></td>
            <td><input type="text" name="homeTeam" value="${game.homeTeam}" data-index="${index}"></td>
            <td><input type="number" name="homeScore" value="${game.homeScore}" data-index="${index}"></td>
            <td><input type="text" name="awayTeam" value="${game.awayTeam}" data-index="${index}"></td>
            <td><input type="number" name="awayScore" value="${game.awayScore}" data-index="${index}"></td>
            <td>
                <select name="status" data-index="${index}">
                    <option value="FINAL" ${game.status === 'FINAL' ? 'selected' : ''}>FINAL</option>
                    <option value="IN PROGRESS" ${game.status === 'IN PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
                </select>
            </td>
            <td>
                <button class="delete-game-btn" data-index="${index}">Delete</button>
            </td>
        `;
        resultsBody.appendChild(row);
    });

    // Add event listeners for input changes
    document.querySelectorAll('#sports-results-table input, #sports-results-table select').forEach(input => {
        input.addEventListener('change', handleInputChange);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-game-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteGame);
    });
}

// Handle input changes
function handleInputChange(event) {
    const index = event.target.dataset.index;
    const field = event.target.name;
    const value = event.target.value;

    sportsData.games[index][field] = value;
}

// Handle game deletion
function handleDeleteGame(event) {
    const index = event.target.dataset.index;
    sportsData.games.splice(index, 1);
    renderSportsResults();
}

// Add new game
document.getElementById('add-game-btn').addEventListener('click', () => {
    sportsData.games.push({
        sportName: '',
        homeTeam: '',
        homeScore: 0,
        awayTeam: '',
        awayScore: 0,
        status: 'FINAL'
    });
    renderSportsResults();
});

const saveBtn = document.getElementById('save-btn');
//Process save
saveBtn.addEventListener("click", function () {
    const inputValues = sportsData;
    console.log("Sending input values to server", inputValues);
    return new Promise((resolve, reject) => {
        // Set a timeout to reject the request if no response within 5 seconds
        const timeout = setTimeout(() => {
            reject(toastr["warning"]("Did not receive a response from the server after 3 seconds. Are you logged in?", 'Save timed out'));
        }, 3000);

        // Emit the event and wait for the server callback
        socket.emit('sportsData', inputValues, (response) => {
            clearTimeout(timeout); // Cancel the timeout

            resolve(toastr[response.status](" ", response.message));
        });
    });
});

// Load existing sports results
function processFormInputs() {
    fetch('/data/sports.json')
        .then(response => response.json())
        .then(data => {
            sportsData = data;
            renderSportsResults();
        })
        .catch(error => {
            console.error('Error loading sports scores:', error);
            toastr["error"](error, "Error loading sports scores from database");
        });
}


socket.on("disconnect", () => {
    toastr["error"]("", 'Lost socket connection to server');
});