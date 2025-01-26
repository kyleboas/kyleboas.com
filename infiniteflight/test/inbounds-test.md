---
Title: Infinite Flight Inbound Search
layout: infiniteflight
permalink: /test/inbounds/
---

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
    
    <div class="settings-menu hidden">
        <div class="dropdown" style="display:none;">
            <button class="dropdown-toggle">Set Defaults ▼</button>
            <div class="dropdown-menu">
                <h2>Set Defaults</h2>
                <input type="number" id="defaultMinHeading" min="0" max="360" placeholder="Minimum">
                <br>
                <input type="number" id="defaultMaxHeading" min="0" max="360" placeholder="Maximum e.g., 360">
                <br>
                <input type="number" id="defaultMinDistance" min="0" placeholder="Minimum e.g., 50">
                <br>
                <input type="number" id="defaultMaxDistance" min="0" placeholder="Maximum e.g., 500">
                <br>
                <button type="button" id="saveDefaultsButton">Save Defaults</button>
            </div>
        </div>

        <!-- Filter Form -->
        <form id="filterForm">
            <div class="HeadingFilter">
              <label class="settings-label">Heading</label>
                <input type="number" id="minHeading" min="0" max="360" placeholder="Minimum">
                <input type="number" id="maxHeading" min="0" max="360" placeholder="Maximum">
                <button type="button" id="boldHeadingButton">Enable</button>
                <button type="button" id="toggleHeadingButton">Hide</button>
            </div> 
            <div class="DistanceFilter">
              <label class="settings-label">Distance</label>
                <input type="number" id="minDistance" min="0" placeholder="Minimum">
                <input type="number" id="maxDistance" min="0" placeholder="Maximum">
                <button type="button" id="applyDistanceFilterButton">Enable</button>
                <button type="button" id="filterHeadingHighlightButton">Split</button>
            </div>
            <button type="button" id="resetDistanceFilterButton" style="display:none;">Filter</button>
        </form>
    </div>
    
    <label>
    <input type="checkbox" id="dark-mode" />
    Enable Dark Mode
</label>

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
                <th style="padding-left: 25px; padding-right: 25px;">Aircraft</th>
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
// Toggle the visibility of the settings menu
document.getElementById('settings').addEventListener('click', () => {
    const settingsMenu = document.querySelector('.settings-menu');
    settingsMenu.classList.toggle('visible'); // Toggle the 'visible' class
});

const checkbox = document.getElementById("checkbox");

checkbox.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode");
});
</script>
<script src="/infiniteflight/test/inbounds-test.js"></script>
