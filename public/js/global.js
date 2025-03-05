const socket = io();


// Get username from session
fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            document.getElementById('user-display').textContent = data.user;
            document.getElementById('version').innerHTML = data.version;
            updateGreeting(data.displayName);
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        toastr["error"](error, "Error fetching user data");
    });

// Handle logout
document.getElementById('logout-btn').addEventListener('click', () => {
    document.getElementById('logout-btn').innerHTML = "Logging Out...";
    setTimeout(function () {
        window.location.href = '/logout';
    }, 1000)
});

function updateGreeting(name) {
    const greetingElement = document.getElementById("greeting");
    const hour = new Date().getHours();
    let greeting;

    if (hour < 12) {
        greeting = "Good morning, " + name;
    } else if (hour < 18) {
        greeting = "Good afternoon, " + name;
    } else {
        greeting = "Good evening, " + name;
    }

    greetingElement.textContent = greeting;
}

// Generic function to process form inputs from a JSON file
function processFormInputs(jsonPath, successCallback, errorMessage) {
    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll(".form-input").forEach(element => {
                if (data[element.id] || data[element.id] === "") {
                    console.log(`Loading "${element.id}" with "${data[element.id]}" from database`);

                    // Handle array inputs (for config.js)
                    if (Array.isArray(data[element.id])) {
                        document.getElementById(element.id).value = data[element.id].join('\n');
                    } else {
                        document.getElementById(element.id).value = data[element.id];
                    }
                } else {
                    toastr["warning"]("Ensure the key exists in the database", `The element ID "${element.id}" was not found in the database.`);
                }
            });
            
            document.querySelectorAll(".form-checkbox").forEach(element => {
                if (data[element.id] == true || data[element.id] == false) {
                    console.log(`Marking "${element.id}" with "${data[element.id]}" from database`);
                    document.getElementById(element.id).checked = data[element.id];
                } else {
                    toastr["warning"]("Ensure the key exists in the database", `The element ID "${element.id}" was not found in the database.`);
                }
            });

            // success callback
            if (successCallback) successCallback(data);
        })
        .catch(error => {
            console.error(errorMessage, error);
            toastr["error"](error, errorMessage);
        });
}

// Generic save function with timeout and socket emission
function setupSaveButton(eventName, getInputValuesFunc) {
    const saveBtn = document.getElementById('save-btn');

    saveBtn.addEventListener("click", function () {
        const inputValues = getInputValuesFunc();
        console.log("Sending input values to server", inputValues);

        return new Promise((resolve, reject) => {
            // Set a timeout to reject the request if no response within 3 seconds
            const timeout = setTimeout(() => {
                reject(toastr["warning"]("Did not receive a response from the server after 3 seconds. Are you logged in?", 'Save timed out'));
            }, 3000);

            // Emit the event and wait for the server callback
            socket.emit(eventName, inputValues, (response) => {
                clearTimeout(timeout); // Cancel the timeout
                resolve(toastr[response.status](" ", response.message));
            });
        });
    });
}

// Socket disconnection handler
socket.on("disconnect", () => {
    toastr["error"]("", 'Lost socket connection to server');
});