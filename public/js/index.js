// Get username from session
fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            document.getElementById('user-display').textContent = data.user;
            document.getElementById('version').innerHTML = data.version;
            document.getElementById('subscriberImg').src = data.subscriberImgUrl;
            updateGreeting(data.displayName);
        }
    })
    .catch(error => console.error('Error fetching user data:', error));

// Handle logout
document.getElementById('logout-btn').addEventListener('click', () => {
    window.location.href = '/logout';
});

function updateGreeting(name) {
    const greetingElement = document.getElementById("greeting");
    const hour = new Date().getHours();
    let greeting;

    if (hour < 12) {
        greeting = "Good morning, "+name;
    } else if (hour < 18) {
        greeting = "Good afternoon, "+name;
    } else {
        greeting = "Good evening, "+name;
    }

    greetingElement.textContent = greeting;
}