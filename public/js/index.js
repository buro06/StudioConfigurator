// Setup save button with custom input gathering
setupSaveButton('textsData', () =>
    Array.from(document.querySelectorAll('.form-input, .form-checkbox'))
        .map(element => {
            if (element.type === 'checkbox') return element.checked;
            else return element.value;
        })
);

// Load text inputs
processFormInputs('/output/texts.json', null, "Error processing the texts database");

// Additional autofill logic
fetch('/data/config.json')
    .then(response => response.json())
    .then(data => {
        if (data.namesList) {
            $("input[autofill]").autocomplete({
                source: data.namesList,
                minLength: 1 // Minimum characters before suggestions appear
            });
        }
    })
    .catch(error => {
        console.error('Error fetching autofill data:', error);
        toastr["error"](error, "Error fetching autofill data");
    });