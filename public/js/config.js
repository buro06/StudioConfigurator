function processFormInputs() {
    //Load texts json
    fetch('/data/config.json')
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll(".form-input").forEach(element => {
                if (data[element.id] || data[element.id] == "") {
                    console.log("Loading \"" + element.id + "\" with \"" + data[element.id] + "\" from database")
                    if(Array.isArray(data[element.id])) {
                        document.getElementById(element.id).value = data[element.id].join('\n');
                    } else {
                        document.getElementById(element.id).value = data[element.id];
                    }
                } else {
                    toastr["warning"]("Ensure the key exists in the database", 'The element ID \"' + element.id + '\" was not found in the database.');
                }
            });
        })
        .catch(error => {
            console.error('Error processing the config database', error);
            toastr["error"](error, "Error processing the config database");
        });
}

const socket = io();

const saveBtn = document.getElementById('save-btn');
//Process save
saveBtn.addEventListener("click", function () {
    const inputValues = Array.from(document.querySelectorAll('.form-input')).map(element => element.value.split('\n'));
    console.log("Sending input values to server", inputValues);
    return new Promise((resolve, reject) => {
        // Set a timeout to reject the request if no response within 5 seconds
        const timeout = setTimeout(() => {
            reject(toastr["warning"]("Did not receive a response from the server after 3 seconds. Are you logged in?", 'Save timed out'));
        }, 3000);

        // Emit the event and wait for the server callback
        socket.emit('configData', inputValues, (response) => {
            clearTimeout(timeout); // Cancel the timeout
            resolve(toastr[response.status](" ", response.message));
        });
    });
});

socket.on("disconnect", () => {
    toastr["error"]("", 'Lost socket connection to server');
});