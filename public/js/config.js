// Setup save button with custom input gathering
setupSaveButton('configData', () =>
    Array.from(document.querySelectorAll('.form-input')).map(element => element.value.split('\n'))
);

// Load configuration inputs
processFormInputs('/data/config.json', null, "Error processing the config database");


function uploadFile(type) {
    const fileInput = document.getElementById(type + "Input");

    if (fileInput.files.length === 0) {
        toastr["warning"]("Add a file to upload.", 'No file selected')
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();


    if (file.size > 1048576) { // if larger than 1MB
        toastr["warning"]("Maximum allowed size is 1MB.", 'File is too large')
        return;
    }

    reader.onload = function (event) {
        const fileData = event.target.result.split(",")[1]; // Extract base64 data
        return new Promise((resolve, reject) => {
            // Set a timeout to reject the request if no response within 3 seconds
            const timeout = setTimeout(() => {
                reject(toastr["warning"]("Did not receive a response from the server after 3 seconds. Are you logged in?", 'Upload timed out'));
            }, 3000);

            // Emit the event and wait for the server callback
            socket.emit("file-upload", { fileName: file.name, fileData, type }, (response) => {
                clearTimeout(timeout); // Cancel the timeout
                resolve(toastr[response.status](" ", response.message));
            });
        });
    };

    reader.readAsDataURL(file);
}