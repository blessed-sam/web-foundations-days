const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusMessage = document.getElementById("status");
const usersList = document.getElementById("users-list");

let users = [];

async function loadUsers() {
  loadButton.disabled = true;
  statusMessage.textContent = "Loading users...";
  usersList.replaceChildren();

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    users = data;

    renderUsers(users);

    statusMessage.textContent = `Successfully loaded ${users.length} users.`;
  } catch (error) {
    users = [];
    renderUsers([]);

    statusMessage.textContent = "Failed to load users. Please try again.";

    console.error("Error loading users:", error);
  } finally {
    loadButton.disabled = false;
  }
}

function renderUsers(list) {
  usersList.replaceChildren();

  if (list.length === 0) {
    return;
  }

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

    listItem.appendChild(name);
    listItem.appendChild(email);
    listItem.appendChild(city);
    listItem.appendChild(company);

    usersList.appendChild(listItem);
  });
}

loadButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", function () {
  const searchText = filterInput.value.trim().toLowerCase();

  const filteredUsers = users.filter(function (user) {
    return user.name.toLowerCase().includes(searchText);
  });

  renderUsers(filteredUsers);

  if (users.length === 0) {
    statusMessage.textContent = "Load users to begin searching.";
  } else if (filteredUsers.length === 0) {
    statusMessage.textContent = "No users match your filter.";
  } else {
    statusMessage.textContent = `Showing ${filteredUsers.length} of ${users.length} users.`;
  }
});
