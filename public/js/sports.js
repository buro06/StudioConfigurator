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
            <td><input type="text" name="sportName" value="${game.sportName || ''}" data-index="${index}"></td>
            <td><input type="text" name="homeTeam" value="${game.homeTeam || ''}" data-index="${index}"></td>
            <td><input type="number" name="homeScore" value="${game.homeScore || 0}" data-index="${index}"></td>
            <td><input type="text" name="awayTeam" value="${game.awayTeam || ''}" data-index="${index}"></td>
            <td><input type="number" name="awayScore" value="${game.awayScore || 0}" data-index="${index}"></td>
            <td><input type="text" name="gameDate" value="${game.gameDate || ''}" 
                       placeholder="DAY" 
                       data-index="${index}"></td>
            <td><input type="text" name="gameTime" value="${game.gameTime || ''}" placeholder="HH:MM AM/PM" data-index="${index}"></td>
            <td>
                <select name="status" data-index="${index}">
                    <option value="UPCOMING" ${game.status === 'UPCOMING' ? 'selected' : ''}>UPCOMING</option>
                    <option value="LIVE" ${game.status === 'LIVE' ? 'selected' : ''}>LIVE</option>
                    <option value="FINAL" ${game.status === 'FINAL' ? 'selected' : ''}>FINAL</option>
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
    let value = event.target.value;

    // Convert scores to numbers
    if (field === 'homeScore' || field === 'awayScore') {
        value = parseInt(value) || 0;
    }

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
        gameDate: '',
        gameTime: '',
        status: 'UPCOMING'
    });
    renderSportsResults();
});

// Export Games with date, time, and seconds
document.getElementById('export-json-btn').addEventListener('click', () => {
    const dataStr = JSON.stringify(sportsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    // Get current date and time in YYYY-MM-DD-HH-MM-SS format
    const now = new Date();
    const dateString = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-');
    const timeString = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('-');
    
    const exportFileDefaultName = `sc_sports-${dateString}_${timeString}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
});

// Import Games
document.getElementById('import-json-btn').addEventListener('click', () => {
    document.getElementById('json-file-input').click();
});

document.getElementById('json-file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData && Array.isArray(importedData.games)) {
                sportsData = importedData;
                renderSportsResults();
                toastr.success('Games imported successfully. Don\'t forget to save.');
            } else {
                toastr.error('Invalid file format. Expected object with "games" array.');
            }
        } catch (error) {
            toastr.error('Error parsing file: ' + error.message);
        }
    };
    reader.readAsText(file);
});

// Setup save button with custom input gathering
setupSaveButton('sportsData', () => sportsData);

// Load existing sports results
processFormInputs('/data/sports.json', (data) => {
    sportsData = data;
    renderSportsResults();
}, "Error loading sports scores from database");