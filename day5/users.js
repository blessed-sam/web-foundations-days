// API endpoint
const API_URL = "https://jsonplaceholder.typicode.com/users";

// Get HTML elements
const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusMessage = document.getElementById("status");
const usersList = document.getElementById("users-list");

// Store all users returned by the API
let users = [];

// Load users from the API
async function loadUsers() {
    loadButton.disabled = true;
    statusMessage.textContent = "Loading users...";
    usersList.replaceChildren();

    try {
        // Send a request to the API
        const response = await fetch(API_URL);

        // Check whether the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        // Convert the response into JavaScript data
        const data = await response.json();

        // Store the returned users
        users = data;

        // Display all users
        renderUsers(users);

        // Display a success message
        statusMessage.textContent = `Successfully loaded ${users.length} users.`;

    } catch (error) {
        // Handle errors
        users = [];
        renderUsers([]);

        statusMessage.textContent =
            "Failed to load users. Please try again.";

        console.error("Error loading users:", error);

    } finally {
        // Always re-enable the button
        loadButton.disabled = false;
    }
}

// Display an array of users
function renderUsers(list) {
    // Remove previously displayed users
    usersList.replaceChildren();

    // Handle an empty result
    if (list.length === 0) {
        return;
    }

    // Create a list item for each user
    list.forEach(function (user) {
        const listItem = document.createElement("li");

        const name = document.createElement("h2");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;

        const company = document.createElement("p");
        company.textContent = `Company: ${user.company.name}`;

        // Add the details to the list item
        listItem.appendChild(name);
        listItem.appendChild(email);
        listItem.appendChild(city);
        listItem.appendChild(company);

        // Add the list item to the page
        usersList.appendChild(listItem);
    });
}

// Listen for clicks on the Load Users button
loadButton.addEventListener("click", loadUsers);

// Filter users as the user types
filterInput.addEventListener("input", function () {
    const searchText = filterInput.value.trim().toLowerCase();

    // Filter the stored users without making another request
    const filteredUsers = users.filter(function (user) {
        return user.name.toLowerCase().includes(searchText);
    });

    // Display the matching users
    renderUsers(filteredUsers);

    // Display the appropriate status message
    if (users.length === 0) {
        statusMessage.textContent = "Load users to begin searching.";
    } else if (filteredUsers.length === 0) {
        statusMessage.textContent = "No users match your filter.";
    } else {
        statusMessage.textContent =
            `Showing ${filteredUsers.length} of ${users.length} users.`;
    }
});