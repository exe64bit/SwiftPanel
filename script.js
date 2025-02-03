// Date and Time
function updateDateTime() {
    const now = new Date();
    document.getElementById('date-time').textContent = now.toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

// Search Functionality
function searchWeb() {
    const query = document.getElementById('search').value;
    if (query) {
        const safeQuery = encodeURIComponent(query);
        const searchUrl = `https://www.google.com/search?q=${safeQuery}`;
        window.open(searchUrl, '_blank');
    }
}

// Enable Enter Key for Search
document.getElementById('search').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        searchWeb();
    }
});

// Shortcuts Management
const shortcutList = document.getElementById('shortcut-list');
const shortcutForm = document.getElementById('add-shortcut-form');
let editingIndex = null;

function loadShortcuts() {
    const shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
    shortcutList.innerHTML = '';
    shortcuts.forEach((shortcut, index) => {
        const container = document.createElement('div');
        container.className = 'shortcut-container';
        container.title = shortcut.name; // Tooltip for the shortcut

        const img = document.createElement('img');
        img.src = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url=${encodeURIComponent(shortcut.url)}&size=32`;
        img.alt = shortcut.name;

        // Create the three-dot menu inside the shortcut container
        const menu = document.createElement('div');
        menu.className = 'three-dot-menu';
        menu.innerHTML = '⋮';

        container.appendChild(img);
        container.appendChild(menu);

        // Handle shortcut click
        container.addEventListener('click', function (e) {
            if (!e.target.closest('.three-dot-menu')) {
                window.open(shortcut.url, '_blank');
            }
        });

        // Handle menu button click
        menu.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent triggering the shortcut
            openMenuModal(index);
        });

        shortcutList.appendChild(container);
    });
}

function saveShortcut(e) {
    e.preventDefault();
    const name = document.getElementById('shortcut-name').value;
    const url = document.getElementById('shortcut-url').value;

    const shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
    if (editingIndex !== null) {
        shortcuts[editingIndex] = { name, url };
        editingIndex = null;
    } else {
        shortcuts.push({ name, url });
    }

    localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    loadShortcuts();
    closeModal();
    shortcutForm.reset();
}

function deleteShortcut(index) {
    const shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
    shortcuts.splice(index, 1);
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    loadShortcuts();
}

function editShortcut(index) {
    const shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
    const shortcut = shortcuts[index];
    document.getElementById('shortcut-name').value = shortcut.name;
    document.getElementById('shortcut-url').value = shortcut.url;
    editingIndex = index;
    openModal();
    closeMenuModal();
}

function openMenuModal(index) {
    const menuModal = document.getElementById('menu-modal');
    const editBtn = document.getElementById('edit-shortcut-btn');
    const deleteBtn = document.getElementById('delete-shortcut-btn');
    
    editBtn.onclick = () => editShortcut(index);
    deleteBtn.onclick = () => deleteShortcut(index);

    menuModal.style.display = 'flex';
}

function closeMenuModal() {
    const menuModal = document.getElementById('menu-modal');
    menuModal.style.display = 'none';
}

function openModal() {
    document.getElementById('shortcut-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('shortcut-modal').style.display = 'none';
    shortcutForm.reset();
    editingIndex = null;
}

document.getElementById('add-shortcut-btn').addEventListener('click', openModal);
document.getElementById('close-modal-btn').addEventListener('click', closeModal);
document.getElementById('close-menu-btn').addEventListener('click', closeMenuModal);
shortcutForm.addEventListener('submit', saveShortcut);
loadShortcuts();

// Data storage for search history
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

// Show suggestions when the input is focused
const searchInput = document.getElementById('search');
const suggestionList = document.getElementById('suggestion-list');

searchInput.addEventListener('focus', showSuggestions);
searchInput.addEventListener('input', showSuggestions);

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionList.contains(e.target)) {
        suggestionList.style.display = 'none';
    }
});

function showSuggestions() {
    const query = searchInput.value.toLowerCase();
    const filteredSuggestions = searchHistory.filter((item) =>
        item.toLowerCase().includes(query)
    );

    suggestionList.innerHTML = '';
    filteredSuggestions.forEach((suggestion) => {
        const listItem = document.createElement('li');
        listItem.textContent = suggestion;
        listItem.addEventListener('click', () => {
            searchInput.value = suggestion;
            suggestionList.style.display = 'none';
        });
        suggestionList.appendChild(listItem);
    });

    suggestionList.style.display = filteredSuggestions.length ? 'block' : 'none';
}

// Save search term on search function
function searchWeb() {
    const query = searchInput.value.trim();
    if (query && !searchHistory.includes(query)) {
        searchHistory.push(query);
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }

    if (query) {
        const safeQuery = encodeURIComponent(query);
        const searchUrl = `https://www.google.com/search?q=${safeQuery}`;
        window.open(searchUrl, '_blank');
    }
}
// Toggle the hamburger menu
function toggleMenu() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
}

// Show search history in a popup
function showSearchHistory() {
    const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const searchHistoryList = document.getElementById('searchHistoryList');
    searchHistoryList.innerHTML = '';  // Clear previous history

    if (searchHistory.length === 0) {
        searchHistoryList.innerHTML = 'No search history found.';
    } else {
        searchHistory.forEach((item, index) => {
            const searchItemDiv = document.createElement('div');
            searchItemDiv.classList.add('search-item');
            searchItemDiv.innerHTML = `
                <span>${item}</span>
                <button onclick="deleteIndividualHistory(${index})">Delete</button>
            `;
            searchHistoryList.appendChild(searchItemDiv);
        });
    }

    // Show the popup
    document.getElementById('searchHistoryPopup').style.display = 'block';
}

// Delete an individual search history item
function deleteIndividualHistory(index) {
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    searchHistory.splice(index, 1);  // Remove the item at the given index
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));  // Update localStorage
    showSearchHistory();  // Refresh the history list
}

// Delete all search history
function deleteSearchHistory() {
    localStorage.removeItem('searchHistory');
    alert('All search history deleted.');
    showSearchHistory();  // Refresh the history list
}

// Close the popup
function closePopup() {
    document.getElementById('searchHistoryPopup').style.display = 'none';
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Close the dropdown menu when clicking outside
window.onclick = function(event) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    const threeDotMenu = document.getElementById('three-dot-menu');
    if (!threeDotMenu.contains(event.target)) {
        dropdownMenu.style.display = 'none';
    }
}

// Check if the profile details exist in localStorage
window.onload = function() {
    const profileData = localStorage.getItem('profileData');
    
    if (!profileData) {
        // Show the modal if profile data doesn't exist
        document.getElementById('profile-modal').style.display = 'flex';
    } else {
        // Load profile data if it exists
        const data = JSON.parse(profileData);
        document.getElementById('profile-picture').src = data.profilePicture || 'profile.png';
        document.getElementById('user-name').textContent = data.name || 'Anirban';
    }

    // Close modal functionality
    document.getElementById('close-modal-btn').addEventListener('click', function() {
        document.getElementById('profile-modal').style.display = 'none';
    });

    // Save the profile data when the user clicks "Save Profile"
    document.getElementById('save-profile-btn').addEventListener('click', function() {
        const name = document.getElementById('user-name-input').value;
        const profilePicture = document.getElementById('profile-image').files[0];

        if (name && profilePicture) {
            // Create a file reader to handle the profile image
            const reader = new FileReader();
            reader.onload = function(e) {
                const profileData = {
                    name: name,
                    profilePicture: e.target.result
                };
                // Save the profile data to localStorage
                localStorage.setItem('profileData', JSON.stringify(profileData));

                // Close the modal and update the profile display
                document.getElementById('profile-modal').style.display = 'none';
                document.getElementById('profile-picture').src = e.target.result;
                document.getElementById('user-name').textContent = name;
            };
            reader.readAsDataURL(profilePicture);
        } else {
            alert('Please enter your name and select a profile picture.');
        }
    });
}
// Function to open the Edit Profile modal
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'flex';
    modal.style.flexWrap = 'wrap';
    modal.style.flexDirection = 'column';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
}


// Function to close the Edit Profile modal
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'none'; // Hide the modal
}

// Function to preview the uploaded profile picture
function previewImage(event) {
    const imagePreview = document.getElementById('imagePreview');
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result; // Show the image preview
            imagePreview.style.display = 'block'; // Make the image preview visible
        }
        reader.readAsDataURL(file);
    }
}

// Function to save the updated profile (name and picture)
function saveProfile() {
    const name = document.getElementById('profileName').value;
    const pictureFile = document.getElementById('profilePicture').files[0];

    // Save the profile data to localStorage
    localStorage.setItem('profileName', name);

    // Save the profile picture as base64 string to localStorage (if image is uploaded)
    if (pictureFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('profilePicture', e.target.result);
            updateProfile(); // Update the profile with the new data
        };
        reader.readAsDataURL(pictureFile);
    } else {
        updateProfile(); // If no new picture is uploaded, just update the name
    }

    // Close the modal after saving
    closeEditProfileModal();
}

// Function to update the profile on the page
function updateProfile() {
    const name = localStorage.getItem('profileName') || 'Guest';
    const picture = localStorage.getItem('profilePicture');

    // Update the profile name and picture on the page
    document.getElementById('user-name').textContent = name;

    const profilePicture = document.getElementById('profile-picture');
    if (picture) {
        profilePicture.src = picture; // Update profile picture with base64 image
    }
}

// Call updateProfile on page load to display stored data (if available)
window.onload = function() {
    updateProfile();
};


// Check if user profile is saved in localStorage
window.onload = function() {
    const userName = localStorage.getItem('profileName');
    const profilePicture = localStorage.getItem('profilePicture');
    
    // If profile is not set, show the welcome modal
    if (!userName || !profilePicture) {
        document.getElementById('welcomeModal').style.display = 'block';
    } else {
        updateProfile();  // Update the profile with stored values
    }
};

// Function to preview the uploaded profile picture
function previewUserImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('profilePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Function to save user profile to localStorage
function saveUserProfile() {
    const name = document.getElementById('userName').value;
    const pictureFile = document.getElementById('userProfilePicture').files[0];
    
    if (name && pictureFile) {
        // Save name and profile picture (as base64) to localStorage
        const reader = new FileReader();
        reader.onload = function(e) {
            // Save the name and picture in localStorage
            localStorage.setItem('profileName', name);
            localStorage.setItem('profilePicture', e.target.result);
            
            // Close the welcome modal and update the profile
            document.getElementById('welcomeModal').style.display = 'none';
            updateProfile();
        };
        reader.readAsDataURL(pictureFile);  // Read image as base64
    } else {
        alert('Please provide both name and profile picture.');
    }
}

// Function to update profile displayed on the page
function updateProfile() {
    const userName = localStorage.getItem('profileName') || 'Guest';
    const profilePicture = localStorage.getItem('profilePicture');
    
    document.getElementById('user-name').textContent = userName;
    
    const profileImage = document.getElementById('profile-picture');
    if (profilePicture) {
        profileImage.src = profilePicture;  // Set profile picture from localStorage
    }
}

function getGreeting() {
    const hours = new Date().getHours();
    let greetingMessage;

    // Determine greeting based on time in 24-hour format
    if (hours >= 5 && hours < 12) {
        // Morning: 5 AM to 11:59 AM
        greetingMessage = "Good Morning,";
    } else if (hours >= 12 && hours < 17) {
        // Afternoon: 12 PM to 4:59 PM
        greetingMessage = "Good Afternoon,";
    } else if (hours >= 17 && hours < 21) {
        // Evening: 5 PM to 8:59 PM
        greetingMessage = "Good Evening,";
    } else {
        // Night: 9 PM to 4:59 AM
        greetingMessage = "Good Night,";
    }

    document.getElementById("greeting").textContent = greetingMessage;
}

function updateDateTime() {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString();
    document.getElementById("date-time").textContent = `${formattedDate}`;
}

// Call the functions to set the greeting and update date/time
getGreeting();
updateDateTime();

// Optionally, you can set an interval to update the date/time every minute
setInterval(updateDateTime, 60000);