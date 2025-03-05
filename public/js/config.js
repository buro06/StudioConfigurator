// Setup save button with custom input gathering
setupSaveButton('configData', () => 
    Array.from(document.querySelectorAll('.form-input')).map(element => element.value.split('\n'))
);

// Load configuration inputs
processFormInputs('/data/config.json', (data) => {
    // Additional configuration loading logic if needed
    if (data.namesList) {
        $("input[autofill]").autocomplete({
            source: data.namesList,
            minLength: 1 // Minimum characters before suggestions appear
        });
    }
}, "Error processing the config database");