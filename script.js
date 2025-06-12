// Helper to safely get and parse JSON from localStorage
const getFromLocalStorage = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return defaultValue;
    }
};

// Helper to safely set JSON in localStorage
const setToLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error setting localStorage key "${key}":`, e);
    }
};

// DOM Elements
const profilePictureEl = document.getElementById('profile-picture');
const greetingEl = document.getElementById('greeting');
const userNameEl = document.getElementById('user-name');
const dateTimeEl = document.getElementById('date-time');
const welcomeModal = document.getElementById('welcomeModal');
const searchInput = document.getElementById('search');
const suggestionsContainer = document.getElementById('suggestions-container');
const suggestionList = document.getElementById('suggestion-list'); // This remains for suggestions
const shortcutListEl = document.getElementById('shortcut-list');
const shortcutModal = document.getElementById('shortcut-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const addShortcutForm = document.getElementById('add-shortcut-form');
const shortcutNameInput = document.getElementById('shortcut-name');
const shortcutUrlInput = document.getElementById('shortcut-url');
const menuModal = document.getElementById('menu-modal'); // For shortcut context menu
const editShortcutBtn = document.getElementById('edit-shortcut-btn');
const deleteShortcutBtn = document.getElementById('delete-shortcut-btn');
const dropdownMenu = document.getElementById('dropdown-menu'); // Main top-right dropdown
const editProfileModal = document.getElementById('editProfileModal');
const profileNameInput = document.getElementById('profileName');
const profilePictureInput = document.getElementById('profilePicture');
const imagePreview = document.getElementById('imagePreview');
const userProfilePictureInput = document.getElementById('userProfilePicture');
const profilePreview = document.getElementById('profilePreview');

// RE-ADDED: DOM elements for search history popup
const searchHistoryPopup = document.getElementById('searchHistoryPopup');
const searchHistoryList = document.getElementById('searchHistoryList');


let shortcuts = getFromLocalStorage('shortcuts', []);
let searchHistory = getFromLocalStorage('searchHistory', []);
let editingShortcutId = null; // To keep track of the shortcut being edited/deleted

// The 'hasUserInteractedWithSearch' flag is no longer strictly needed for this UX,
// as history is now only accessed via the menu. Keeping it for future potential use
// or if the autofocus behavior on first load needs to be suppressed for other reasons.
let hasUserInteractedWithSearch = false;

// NEW: Global variable to track if a suggestion click is in progress
let isSuggestionClick = false;


// --- Modal Animation Helpers ---
function openModal(modalElement) {
    modalElement.classList.remove('hidden');
    // Trigger reflow to apply initial hidden state before transition
    modalElement.offsetWidth;
    const modalContent = modalElement.querySelector('[data-modal-content]');
    if (modalContent) {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }
}

function closeModal(modalElement) {
    const modalContent = modalElement.querySelector('[data-modal-content]');
    if (modalContent) {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        // Wait for transition to finish before hiding
        modalContent.addEventListener('transitionend', function handler() {
            modalElement.classList.add('hidden');
            modalContent.removeEventListener('transitionend', handler);
        }, { once: true });
    } else {
        modalElement.classList.add('hidden');
    }
}

// --- User Profile Management ---

function loadUserProfile() {
    const userProfile = getFromLocalStorage('userProfile', null);

    if (userProfile && userProfile.name) {
        greetingEl.textContent = getGreeting();
        userNameEl.textContent = userProfile.name;
        // Use a placeholder image with initials if no custom picture
        profilePictureEl.src = userProfile.picture || `https://via.placeholder.com/150/609BFF/FFFFFF?text=${userProfile.name.charAt(0).toUpperCase()}`;
        profilePictureEl.alt = userProfile.name;
        closeModal(welcomeModal); // Use animated close
    } else {
        openModal(welcomeModal); // Use animated open
    }
}

function saveUserProfile() {
    const name = document.getElementById('userName').value.trim();
    const profilePictureFile = userProfilePictureInput.files[0];
    let profilePictureBase64 = '';

    if (!name) {
        alert('Please enter your name.');
        return;
    }

    if (profilePictureFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePictureBase64 = e.target.result;
            const userProfile = { name: name, picture: profilePictureBase64 };
            setToLocalStorage('userProfile', userProfile);
            loadUserProfile(); // Reload to update UI
        };
        reader.readAsDataURL(profilePictureFile);
    } else {
        // If no new picture is selected, retain the existing one or default
        const existingProfile = getFromLocalStorage('userProfile', {});
        const userProfile = { name: name, picture: existingProfile.picture || `https://via.placeholder.com/150/609BFF/FFFFFF?text=${name.charAt(0).toUpperCase()}` };
        setToLocalStorage('userProfile', userProfile);
        loadUserProfile(); // Reload to update UI
    }
}

function previewUserImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        profilePreview.src = reader.result;
        profilePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(event.target.files[0]);
}

function openEditProfileModal() {
    dropdownMenu.classList.add('hidden'); // Hide main dropdown
    const userProfile = getFromLocalStorage('userProfile', { name: '', picture: '' });
    profileNameInput.value = userProfile.name || '';
    if (userProfile.picture) {
        imagePreview.src = userProfile.picture;
        imagePreview.classList.remove('hidden');
    } else {
        imagePreview.classList.add('hidden');
        imagePreview.src = ''; // Clear src if no picture
    }
    openModal(editProfileModal); // Use animated open
}

function closeEditProfileModal() {
    closeModal(editProfileModal); // Use animated close
    // Clear file input if needed
    profilePictureInput.value = '';
    imagePreview.classList.add('hidden');
    imagePreview.src = ''; // Clear src
}

function saveProfile() {
    const name = profileNameInput.value.trim();
    const profilePictureFile = profilePictureInput.files[0];
    let currentProfile = getFromLocalStorage('userProfile', { name: '', picture: '' });

    if (!name) {
        alert('Name cannot be empty.');
        return;
    }

    if (profilePictureFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentProfile.picture = e.target.result;
            currentProfile.name = name;
            setToLocalStorage('userProfile', currentProfile);
            loadUserProfile();
            closeEditProfileModal();
        };
        reader.readAsDataURL(profilePictureFile);
    } else {
        currentProfile.name = name;
        setToLocalStorage('userProfile', currentProfile);
        loadUserProfile();
        closeEditProfileModal();
    }
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function() {
        imagePreview.src = reader.result;
        imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(event.target.files[0]);
}

// --- Date and Time ---

function updateDateTime() {
    const now = new Date();
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const dateString = now.toLocaleDateString(undefined, optionsDate);
    const timeString = now.toLocaleTimeString(undefined, optionsTime);
    dateTimeEl.textContent = `${dateString} | ${timeString}`;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}

// --- Search Functionality ---

function searchWeb() {
    const query = searchInput.value.trim();
    if (query) {
        addSearchHistory(query);
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        searchInput.value = ''; // Clear input after search
        suggestionsContainer.classList.add('hidden'); // Hide suggestions
    }
}

function addSearchHistory(query) {
    // Add only if it's a new query and not empty, and different from the last one
    if (query && (searchHistory.length === 0 || searchHistory[searchHistory.length - 1] !== query)) {
        searchHistory.push(query);
        setToLocalStorage('searchHistory', searchHistory);
    }
}

// This function now populates and opens the dedicated searchHistoryPopup
function showSearchHistory() {
    searchHistoryList.innerHTML = ''; // Clear previous entries

    if (searchHistory.length === 0) {
        const item = document.createElement('li');
        item.className = 'p-3 text-lg text-center text-gray-500 dark:text-gray-400';
        item.textContent = 'No search history available.';
        searchHistoryList.appendChild(item);
    } else {
        // Display history in reverse chronological order (most recent first)
        [...searchHistory].reverse().forEach((query, index) => {
            // We need to adjust index for deletion since we're reversing the display
            const originalIndex = searchHistory.length - 1 - index;

            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition duration-150 border-b border-gray-100 last:border-b-0';
            li.innerHTML = `
                <span class="text-gray-800 dark:text-gray-200 cursor-pointer text-lg flex-grow" onclick="performSearchFromHistory('${query}')">${query}</span>
                <button class="text-red-500 hover:text-red-700 ml-4 bg-transparent border-none text-2xl font-light focus:outline-none" onclick="deleteSearchHistoryItem(${originalIndex}, event)">&times;</button>
            `;
            searchHistoryList.appendChild(li);
        });
    }
    openModal(searchHistoryPopup); // Open the search history modal
}

function performSearchFromHistory(query) {
    searchInput.value = query; // Populate search bar
    searchWeb(); // Perform search
    closeModal(searchHistoryPopup); // Close the history popup after selecting
    suggestionsContainer.classList.add('hidden'); // Ensure suggestions are hidden if something was there
}

function deleteSearchHistoryItem(index, event) {
    event.stopPropagation(); // Prevent the history item click from triggering search
    searchHistory.splice(index, 1); // Remove item at index
    setToLocalStorage('searchHistory', searchHistory);
    showSearchHistory(); // Refresh the displayed history in the popup
}

// MODIFIED: Delete all history and close the popup
function deleteSearchHistory() {
    if (confirm('Are you sure you want to delete all search history?')) {
        searchHistory = [];
        setToLocalStorage('searchHistory', searchHistory);
        alert('Search history deleted.');
        closeModal(searchHistoryPopup); // Close the history popup
        dropdownMenu.classList.add('hidden'); // Hide main dropdown as well
    }
}

// MODIFIED: fetchSuggestions to use search history
async function fetchSuggestions(query) {
    if (query.length === 0) { // No suggestions if query is empty
        suggestionsContainer.classList.add('hidden');
        return;
    }

    // Filter unique items from search history that include the query (case-insensitive)
    // Reversing first to get more recent relevant items at the top of the suggestions.
    const relevantHistorySuggestions = [...new Set(searchHistory)]
        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
        .reverse();

    renderSuggestions(relevantHistorySuggestions.slice(0, 7)); // Limit to 7 suggestions
}

function renderSuggestions(suggestions) {
    suggestionList.innerHTML = '';
    if (suggestions.length === 0) {
        suggestionsContainer.classList.add('hidden');
        return;
    }

    suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.className = 'p-3 text-lg cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 dark:hover:bg-gray-700 dark:text-gray-200 transition duration-150';
        li.textContent = suggestion;

        // Use mousedown instead of click for better event timing
        li.onmousedown = (e) => { // Change from onclick to onmousedown
            e.preventDefault(); // Prevent blur from firing before this handler completes
            isSuggestionClick = true; // Set the flag
            searchInput.value = suggestion; // Populate the search box
            suggestionsContainer.classList.add('hidden'); // Hide suggestions
            searchInput.focus(); // Keep focus on the search input after filling
            // Important: We set isSuggestionClick to false on a small timeout
            // to allow the blur to process normally later.
            setTimeout(() => {
                isSuggestionClick = false;
            }, 50); // A small delay, enough for event propagation
        };
        suggestionList.appendChild(li);
    });
    suggestionsContainer.classList.remove('hidden');
}

// --- Shortcut Management ---

function renderShortcuts() {
    shortcutListEl.innerHTML = '';
    if (shortcuts.length === 0) {
        shortcutListEl.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 col-span-full py-8">No shortcuts added yet. Click the menu top-right to add one!</p>';
        return;
    }

    shortcuts.forEach(shortcut => {
        const shortcutDiv = document.createElement('div');
        shortcutDiv.className = 'shortcut-container w-full h-32 bg-white rounded-xl shadow-md flex flex-col justify-center items-center relative cursor-pointer overflow-hidden transform hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out dark:bg-gray-700 dark:text-gray-100 group'; // Added 'group' class for hover effect
        shortcutDiv.innerHTML = `
            <a href="${shortcut.url}" target="_blank" class="flex flex-col items-center text-center p-3 h-full justify-center w-full">
                <img src="${shortcut.icon}" alt="${shortcut.name} icon" class="w-12 h-12 object-contain mb-2">
                <span class="text-sm md:text-base font-medium text-gray-700 dark:text-gray-200 truncate w-full px-1">${shortcut.name}</span>
            </a>
            <button class="absolute top-2 right-2 text-2xl font-bold cursor-pointer text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none dark:text-gray-300 dark:hover:text-gray-100"
                    onclick="showShortcutMenu(event, '${shortcut.id}')">
                &#8226;&#8226;&#8226;
            </button>
        `;
        shortcutListEl.appendChild(shortcutDiv);
    });
}

function showShortcutMenu(event, id) {
    event.preventDefault(); // Prevent default right-click context menu if applicable
    event.stopPropagation(); // Stop event bubbling to prevent document click from closing immediately

    editingShortcutId = id; // Store the ID of the shortcut being acted upon

    // Position the menu modal
    menuModal.style.top = `${event.clientY + 10}px`;
    menuModal.style.left = `${event.clientX + 10}px`;
    menuModal.classList.remove('hidden');
    // Trigger reflow for animation
    menuModal.offsetWidth;
    menuModal.classList.remove('opacity-0', 'scale-95');
    menuModal.classList.add('opacity-100', 'scale-100');
}

// Global click listener to close menu modal when clicking outside
document.addEventListener('click', (event) => {
    // Close shortcut context menu
    if (!menuModal.contains(event.target) && !event.target.closest('.shortcut-container button')) {
        menuModal.classList.add('opacity-0', 'scale-95');
        menuModal.addEventListener('transitionend', function handler() {
            menuModal.classList.add('hidden');
            menuModal.removeEventListener('transitionend', handler);
        }, { once: true });
    }
    // Close main dropdown menu
    if (!dropdownMenu.contains(event.target) && !event.target.closest('#three-dot-menu')) {
        dropdownMenu.classList.add('opacity-0', 'scale-95');
        dropdownMenu.addEventListener('transitionend', function handler() {
            dropdownMenu.classList.add('hidden');
            dropdownMenu.removeEventListener('transitionend', handler);
        }, { once: true });
    }
    // Close suggestions/history if clicked outside search input or container
    // This part is handled by the blur event listener on searchInput.
    // However, for other random clicks outside, we can keep a general check.
    if (!suggestionsContainer.contains(event.target) && event.target !== searchInput) {
        suggestionsContainer.classList.add('hidden');
    }
});


// New function to open the shortcut modal for adding a new shortcut
function openShortcutModal() {
    editingShortcutId = null; // Clear any editing state
    shortcutNameInput.value = '';
    shortcutUrlInput.value = '';
    openModal(shortcutModal); // Use animated open
    shortcutNameInput.focus();
    dropdownMenu.classList.add('hidden'); // Hide the main dropdown menu
}


closeModalBtn.addEventListener('click', () => {
    closeModal(shortcutModal); // Use animated close
});

addShortcutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = shortcutNameInput.value.trim();
    let url = shortcutUrlInput.value.trim();

    if (!name || !url) {
        alert('Please enter both name and URL for the shortcut.');
        return;
    }

    // Ensure URL starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // Get favicon using Google's S2 service (reliable for favicons)
    const iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

    if (editingShortcutId) {
        // Edit existing shortcut
        const index = shortcuts.findIndex(s => s.id === editingShortcutId);
        if (index !== -1) {
            shortcuts[index] = { ...shortcuts[index], name, url, icon: iconUrl };
        }
    } else {
        // Add new shortcut
        const newShortcut = {
            id: Date.now().toString(), // Simple unique ID
            name,
            url,
            icon: iconUrl
        };
        shortcuts.push(newShortcut);
    }
    setToLocalStorage('shortcuts', shortcuts);
    renderShortcuts();
    closeModal(shortcutModal); // Use animated close
    menuModal.classList.add('hidden'); // Hide context menu after saving (if it was open)
});

editShortcutBtn.addEventListener('click', () => {
    if (editingShortcutId) {
        const shortcutToEdit = shortcuts.find(s => s.id === editingShortcutId);
        if (shortcutToEdit) {
            shortcutNameInput.value = shortcutToEdit.name;
            shortcutUrlInput.value = shortcutToEdit.url;
            openModal(shortcutModal); // Use animated open
            // Ensure the context menu is hidden immediately when opening the edit modal
            menuModal.classList.add('opacity-0', 'scale-95');
            menuModal.addEventListener('transitionend', function handler() {
                menuModal.classList.add('hidden');
                menuModal.removeEventListener('transitionend', handler);
            }, { once: true });
        }
    }
});

deleteShortcutBtn.addEventListener('click', () => {
    if (editingShortcutId && confirm('Are you sure you want to delete this shortcut?')) {
        shortcuts = shortcuts.filter(s => s.id !== editingShortcutId);
        setToLocalStorage('shortcuts', shortcuts);
        renderShortcuts();
        // Hide context menu with animation
        menuModal.classList.add('opacity-0', 'scale-95');
        menuModal.addEventListener('transitionend', function handler() {
            menuModal.classList.add('hidden');
            menuModal.removeEventListener('transitionend', handler);
        }, { once: true });
        editingShortcutId = null; // Clear editing state
    }
});

// --- Main Dropdown Menu ---

function toggleMenu() {
    if (dropdownMenu.classList.contains('hidden')) {
        dropdownMenu.classList.remove('hidden');
        dropdownMenu.offsetWidth; // Trigger reflow
        dropdownMenu.classList.remove('opacity-0', 'scale-95');
        dropdownMenu.classList.add('opacity-100', 'scale-100');
    } else {
        dropdownMenu.classList.remove('opacity-100', 'scale-100');
        dropdownMenu.classList.add('opacity-0', 'scale-95');
        dropdownMenu.addEventListener('transitionend', function handler() {
            dropdownMenu.classList.add('hidden');
            dropdownMenu.removeEventListener('transitionend', handler);
        }, { once: true });
    }
}

// Function to open search history from the menu - now opens the dedicated popup
function openSearchHistoryFromMenu() {
    closeModal(dropdownMenu); // Close the main dropdown menu
    showSearchHistory(); // Call the function that populates and opens the history popup
}


// --- Dark Mode Toggle ---

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDarkMode = document.documentElement.classList.contains('dark');
    setToLocalStorage('darkMode', isDarkMode);
    // Animate dropdown menu closing
    dropdownMenu.classList.remove('opacity-100', 'scale-100');
    dropdownMenu.classList.add('opacity-0', 'scale-95');
    dropdownMenu.addEventListener('transitionend', function handler() {
        dropdownMenu.classList.add('hidden');
        dropdownMenu.removeEventListener('transitionend', handler);
    }, { once: true });
}

function loadDarkModePreference() {
    const isDarkMode = getFromLocalStorage('darkMode', false);
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    }
}

// --- Event Listeners and Initial Load ---

document.addEventListener('DOMContentLoaded', () => {
    loadDarkModePreference();
    loadUserProfile();
    updateDateTime();
    setInterval(updateDateTime, 1000); // Update time every second
    renderShortcuts();

    // Search input event listener for 'input' - NOW ONLY for history-based suggestions
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (query.length > 0) {
            fetchSuggestions(query); // Show suggestions based on history
        } else {
            // If input is empty, hide suggestions
            suggestionsContainer.classList.add('hidden');
        }
    });

    // Modified blur listener for search input
    searchInput.addEventListener('blur', () => {
        // Only hide if a suggestion click is NOT in progress
        if (!isSuggestionClick) {
            // Delay hiding slightly to allow actual clicks on suggestions
            // to register before the container disappears.
            setTimeout(() => {
                // Double check if focus is still not on searchInput or within suggestions
                if (document.activeElement !== searchInput && !suggestionsContainer.contains(document.activeElement)) {
                    suggestionsContainer.classList.add('hidden');
                }
            }, 100);
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchWeb();
        }
    });
});
