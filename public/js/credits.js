const textElements = document.getElementsByClassName('text');

Array.from(textElements).forEach(element => {
    fetch('/get?q=' + element.id.slice(0, -4))
        .then(response => response.text())  // Extract the body as text
        .then(html => {
            console.log("Updating \"" + element.id + "\" with \"" + html + "\"");
            element.innerHTML = html;
        })
        .catch(error => {
            console.error('Error fetching the HTML:', error);
        });
});

function checkActiveNames(query, elementName) {
    fetch('/get?q='+query)
        .then(response => response.text())  // Extract the body as text
        .then(html => {
            console.log(query+" is "+html);
            if(html == 'false') {
                console.log('Removing '+elementName);
                document.getElementById(elementName).remove();
                document.getElementById(elementName+'Text').remove();
            }
        })
        .catch(error => {
            console.error('Error fetching the HTML:', error);
        });
}


checkActiveNames('weatherAnchorActive', 'weatherAnchor');
checkActiveNames('sportsAnchorActive', 'sportsAnchor');


