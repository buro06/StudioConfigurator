// Get username from session
fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            document.getElementById('user-display').textContent = data.user;
            document.getElementById('version').innerHTML = data.version;
            document.getElementById('subscriberImg').src = data.subscriberImgUrl;
            updateGreeting(data.displayName);
            processFormInputs();
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        alert("Error fetching user data. See console.");
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



function processFormInputs() {
    //Load texts json
    fetch('/output/texts.json')
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll(".form-input").forEach(element => {
                if (data[element.id] || data[element.id] == "") {
                    console.log("Loading \""+element.id+"\" with \""+data[element.id]+"\" from database")
                    document.getElementById(element.id).value = data[element.id];
                } else {
                    alert('The element ID \"' + element.id + '\" was not found in the database.')
                }
            });
        })
        .catch(error => {
            console.error('Error processing the texts database', error);
            alert("Error processing the texts database. See console.");
        });
}