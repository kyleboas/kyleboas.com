---
Title: Infinite Flight Inbound Search
layout: infiniteflight
permalink: /infiniteflight/inbounds/
---

<div class="settings-menu hidden">
  <div class="settings-header">
    <strong>Settings</strong>
    <div class="theme-toggle-wrapper">    
      <label
        for="themeToggle"
        class="themeToggle st-sunMoonThemeToggleBtn"
        type="checkbox"
        aria-label="Toggle Dark Mode"
      >
        <input type="checkbox" id="themeToggle" class="themeToggleInput" />
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="currentColor"
          stroke="none"
        >
          <mask id="moon-mask">
            <rect x="0" y="0" width="20" height="20" fill="white"></rect>
            <circle cx="11" cy="3" r="8" fill="black"></circle>
          </mask>
          <circle
            class="sunMoon"
            cx="10"
            cy="10"
            r="8"
            mask="url(#moon-mask)"
          ></circle>
          <g>
            <circle class="sunRay sunRay1" cx="18" cy="10" r="1.5"></circle>
            <circle class="sunRay sunRay2" cx="14" cy="16.928" r="1.5"></circle>
            <circle class="sunRay sunRay3" cx="6" cy="16.928" r="1.5"></circle>
            <circle class="sunRay sunRay4" cx="2" cy="10" r="1.5"></circle>
            <circle class="sunRay sunRay5" cx="6" cy="3.1718" r="1.5"></circle>
            <circle class="sunRay sunRay6" cx="14" cy="3.1718" r="1.5"></circle>
          </g>
        </svg>
      </label>
      <i class="fa-solid fa-xmark" aria-label="Close"></i>
    </div>
  </div>

  <!-- Filter Form -->
  <form id="filterForm" style="display:none;">
    <div class="HeadingFilter">
      <label class="settings-label">Heading</label>
      <input
        type="number"

        min="0"
        max="360"
        placeholder="Minimum"
        aria-label="Minimum Heading"
      />
      <input
        type="number"
        
        min="0"
        max="360"
        placeholder="Maximum"
        aria-label="Maximum Heading"
      />
      <button type="button">Enable</button>
      <button type="button" id="toggleHeadingButton">Hide</button>
    </div>
    <div class="DistanceFilter">
      <label class="settings-label">Distance</label>
      <input
        type="number"
        
        min="0"
        placeholder="Minimum"
        aria-label="Minimum Distance"
      />
      <input
        type="number"
        
        min="0"
        placeholder="Maximum"
        aria-label="Maximum Distance"
      />
      <button type="button"">Enable</button>
      <button type="button">Split</button>
    </div>
    <button
      type="button"
      id="resetDistanceFilterButton"
      style="display:none;"
    >
      Filter
    </button>
  </form>

  <!-- Setting Containers -->
  <div class="setting-container">
    <div class="setting">
      <button class="overlay-button"></button>    
      <span class="setting-button"></span>    
      <p class="setting-title">Heading and Distance</p>
      <p class="setting-description-info">
        Input the minimum and maximum heading and distance to adjust what
        information is shown in the inbounds table.
      </p>
    </div> 
   </div> 
     <div class="HeadingFilter"> 
      <label class="settings-label" for="minHeading">Heading</label>
      <input
        type="number"
        id="minHeading"
        min="0"
        max="360"
        placeholder="Minimum heading..."
        aria-label="Minimum heading..."
      />
      <input
        type="number"
        id="maxHeading"
        min="0"
        max="360"
        placeholder="Maximum heading..."
        aria-label="Maximum heading..."
      />
     </div> 
     <div class="DistanceFilter"> 
      <label class="settings-label" for="minDistance">Distance</label>
      <input
        type="number"
        id="minDistance"
        min="0"
        placeholder="Minimum distance..."
        aria-label="Minimum Distance"
      />
      <input
        type="number"
        id="maxDistance"
        min="0"
        placeholder="Maximum distance..."
        aria-label="Maximum distance..."
      />
      </div>
  <div class="setting-container">
    <div class="setting-border" id="boldHeadingBorder">
      <button class="overlay-button" id="boldHeadingButton"></button>    
      <span class="setting-button"></span> 
      <p class="setting-title">Bold Aircraft by Heading</p>
      <p class="setting-description">
        Aircraft within the heading range will be bold, to make them stand out in the table. Making it easier to track aircraft coming from one direction.
      </p>
     </div>
   </div>
   <div class="setting-container" id="DistanceFilterContainer">
    <div class="setting-border">
      <button class="overlay-button" id="applyDistanceFilterButton"></button>    
      <span class="setting-button"></span> 
      <p class="setting-title">Distance Filter</p>
      <p class="setting-description">
        Filter the table to exclude aircraft outside the distance range.
      </p>
     </div>
   </div>
   <div class="setting-container">
    <div class="setting-border">
      <button class="overlay-button" id="filterHeadingHighlightButton"></button>    
      <span class="setting-button"></span> 
      <p class="setting-title">Split Filter</p>
      <p class="setting-description">
        Input both the heading and distance to split traffic based on direction. When it is disabled, the highlighted colors will be associated with the aircraft's direction of travel. For example, if you input 90 and 270 as the heading, aircraft from the North will only be compared to aircraft to the North, and aircraft from the South will only be compared to aircraft from the South.
      </p>
     </div>
   </div>
 <div class="setting-information">
  <div class="setting-container">
    <div class="setting">
      <p class="setting-title">Separation</p>
      <p class="setting-description">
        The table is color coded based on ETA (Estimated Time of Arrival)
        separation.
      </p>
      <div class="box-container">
        <div class="box" style="background-color:#fffa9f;"></div>
        <p class="setting-description">10 seconds separation.</p>
      </div>
      <div class="box-container">
        <div class="box" style="background-color:#80daeb;"></div>
        <p class="setting-description">30 seconds separation.</p>
      </div>
      <div class="box-container">
        <div class="box" style="background-color:#daceca;"></div>
        <p class="setting-description">60 seconds separation.</p>
      </div>
      <div class="box-container">
        <div class="box" style="background-color:#eaeaea;"></div>
        <p class="setting-description">120 seconds separation.</p>
      </div>
    </div>
  </div>
</div> 
</div>

<div class="container">
   <div class="page-left">
    <div class="nav-container">
        <div class="nav-left">
            <input 
                type="text" 
                id="icao" 
                name="icao" 
                placeholder="Airport"
            />
            <button id="search">
                <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            </button>
            <button id="add">
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
            </button>
            <button id="settings">
                <i class="fa-solid fa-sliders" aria-hidden="true"></i>
            </button>
            <button id="update">
                <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
            </button>
        </div>
        <div class="nav-right" id="atcAirportsList">
        </div>
    </div>
   </div>
  </div>      


    <!-- ATC Table -->
    <table id="atcTable">
        <thead>
            <tr>
                <th>Airport</th>
                <th>Freq.</th>
                <th>50nm</th>
                <th>200nm</th>
                <th>500nm</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <!-- Dynamic rows will be added here -->
        </tbody>
    </table>
    
    <!-- Secondary Airport Section -->
    <div id="secondaryAirport">
        <div id="secondaryAirportContainer"></div>
    </div>

    <div class="mainAirport" style="display: none;">
        <p class="atisMessage" id="atisMessage" style="display: none;">ATIS: Not fetched yet</p>
        <p class="controllersList" id="controllersList" style="display: none;">No active ATC.</p>
    </div>
   </div> 
   <div class="page-right">
    <table id="flightsTable">
        <thead>
            <tr>
                <th class="column-one">Aircraft</th>
                <th>MIN/MAX</th>
                <th>GS/MACH</th>
                <th>HDG/ALT</th>
                <th>NM/ETA</th>
            </tr>
        </thead>
        <tbody>
            <!-- Dynamic rows will be added here -->
        </tbody>
    </table>
</div>

<div style="display: none;">
       <button id="manualUpdateButton">Update Information</button>

        <!-- Secondary Airport Search -->
        <form id="secondarySearchForm" novalidate>
            <input type="text" id="secondaryIcao" name="secondaryIcao" placeholder="Enter Secondary ICAO" required>
            <button type="submit">Add Airport</button>
        </form>

        <button type="button" id="updateButton">Update</button>
        <button type="button" id="stopUpdateButton" style="display: none;">Stop Update</button>
        <span id="countdownTimer" style="display: none;"></span>
</div>

<script>
// Function to save theme preference in localStorage
function saveThemePreference(theme) {
    localStorage.setItem('theme', theme);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    localStorage.setItem('themeExpiration', expirationDate.getTime()); // Save expiration time
}

// Function to load theme preference from localStorage
function loadThemePreference() {
    const expirationTime = localStorage.getItem('themeExpiration');
    const now = new Date().getTime();

    // Check if the saved preference is still valid
    if (expirationTime && now > expirationTime) {
        localStorage.removeItem('theme');
        localStorage.removeItem('themeExpiration');
        return null;
    }
    return localStorage.getItem('theme');
}

// Detect system dark mode preference and apply on page load
document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById("themeToggle");
    const savedTheme = loadThemePreference();

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        checkbox.checked = true;
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        checkbox.checked = false;
    } else {
        // No saved preference; use system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            checkbox.checked = true;
        }
    }

    // Listen for system theme changes and apply them
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!loadThemePreference()) { // Only apply system theme if no user preference is saved
            if (e.matches) {
                document.body.classList.add('dark-mode');
                checkbox.checked = true;
            } else {
                document.body.classList.remove('dark-mode');
                checkbox.checked = false;
            }
        }
    });
});

// Toggle dark mode manually and save preference
const checkbox = document.getElementById("themeToggle");
checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
        document.body.classList.add('dark-mode');
        saveThemePreference('dark'); // Save dark mode preference
    } else {
        document.body.classList.remove('dark-mode');
        saveThemePreference('light'); // Save light mode preference
    }
});

// Toggle the visibility of the settings menu
document.getElementById('settings').addEventListener('click', (event) => {
    const settingsMenu = document.querySelector('.settings-menu');
    settingsMenu.classList.toggle('visible'); // Toggle the 'visible' class
    event.stopPropagation(); // Prevent the event from reaching the document
});

// Close the settings menu when clicking the close button
const closeButton = document.querySelector('.settings-menu .fa-xmark');
closeButton.addEventListener('click', () => {
    const settingsMenu = document.querySelector('.settings-menu');
    settingsMenu.classList.remove('visible'); // Remove the 'visible' class
});

// Close the settings menu when clicking outside of it
document.addEventListener('click', (event) => {
    const settingsMenu = document.querySelector('.settings-menu');
    const settingsButton = document.getElementById('settings');
    if (!settingsMenu.contains(event.target) && !settingsButton.contains(event.target)) {
        settingsMenu.classList.remove('visible'); // Remove the 'visible' class
    }
});

</script>