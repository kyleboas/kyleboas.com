---
layout: infiniteflight
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
                style="width: 50px; border: none; margin-right: -10px; font-size: 14px; outline:none;"
            />
            <button id="search" style="background-color: transparent; color: #828282; font-size: 14px; margin-left:-15px">
                <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            </button>
            <button id="add" style="background-color: transparent; color: #828282; margin-left: -30px; font-size: 14px;">
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
            </button>
            <button id="settings" style="background-color: transparent; color: #828282; margin-left: -30px; font-size: 14px;">
                <i class="fa-solid fa-sliders" aria-hidden="true"></i>
            </button>
            <button id="update" style="background-color: transparent; color: #828282; margin-left: -30px; font-size: 14px;">
                <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
            </button>
        </div>
        <div class="nav-right" id="atcAirportsList" style="font-size: 10px; text-align: left;">
            NZAA 125 YSSY 41<br>
            LSZH 37 EGLL 27
        </div>
      <div class="settings-menu hidden">
        <div class="dropdown">
            <button class="dropdown-toggle">Set Defaults ▼</button>
            <div class="dropdown-menu">
                <h2>Set Defaults</h2>
                <input type="number" id="defaultMinHeading" min="0" max="360" placeholder="Minimum e.g., 0" />
                <br />
                <input type="number" id="defaultMaxHeading" min="0" max="360" placeholder="Maximum e.g., 360" />
                <br />
                <input type="number" id="defaultMinDistance" min="0" placeholder="Minimum e.g., 50" />
                <br />
                <input type="number" id="defaultMaxDistance" min="0" placeholder="Maximum e.g., 500" />
                <br />
                <button type="button" id="saveDefaultsButton">Save Defaults</button>
            </div>
        </div>

        <form id="filterForm" style="margin-top: 20px;">
            <div class="HeadingFilter">
                <input type="number" id="minHeading" min="0" max="360" placeholder="Minimum e.g., 0" />
                <input type="number" id="maxHeading" min="0" max="360" placeholder="Maximum e.g., 90" />
                <button type="button" id="boldHeadingButton">Bold Aircraft</button>
                <button type="button" id="toggleHeadingButton">Hide Aircraft</button>
            </div>
            <div class="DistanceFilter">
                <input type="number" id="minDistance" min="0" placeholder="Minimum e.g., 50" />
                <input type="number" id="maxDistance" min="0" placeholder="Maximum e.g., 500" />
                <button type="button" id="applyDistanceFilterButton">Apply Distance Filter</button>
                <button type="button" id="resetDistanceFilterButton">Reset Filter</button>
            </div>
            <button type="button" id="filterHeadingHighlightButton">Enable Highlight by Heading</button>
        </form>
      </div>
    </div>
    
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
    <div class="container">
        <h1>Search Inbound Infinite Flight Flights</h1>

        <!-- Search Form -->
        <form id="searchForm" novalidate>
            <input type="text" id="icao" name="icao" placeholder="Enter ICAO" required>
            <button type="submit">Search</button>
        </form>

        <div class="dropdown">
            <button class="dropdown-toggle">Set Defaults ▼</button>
            <div class="dropdown-menu">
                <h2>Set Defaults</h2>
                <input type="number" id="defaultMinHeading" min="0" max="360" placeholder="Minimum e.g., 0">
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
        <form id="filterForm" style="margin-top: 20px;">
            <div class="HeadingFilter">
                <input type="number" id="minHeading" min="0" max="360" placeholder="Minimum e.g., 0">
                <input type="number" id="maxHeading" min="0" max="360" placeholder="Maximum e.g., 90">
                <button type="button" id="boldHeadingButton">Bold Aircraft</button>
                <button type="button" id="toggleHeadingButton">Hide Aircraft</button>
            </div> 
            <div class="DistanceFilter">
                <input type="number" id="minDistance" min="0" placeholder="Minimum e.g., 50">
                <input type="number" id="maxDistance" min="0" placeholder="Maximum e.g., 500">
                <button type="button" id="applyDistanceFilterButton">Apply Distance Filter</button>
                <button type="button" id="resetDistanceFilterButton">Reset Filter</button>
            </div>
            <button type="button" id="filterHeadingHighlightButton">Enable Highlight by Heading</button>
        </form>

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
</div>

<script>
document.getElementById('settings').addEventListener('click', () => {
    const settingsMenu = document.querySelector('.settings-menu');
    settingsMenu.classList.toggle('visible'); // Toggle the 'visible' class
});
</script>
<script src="/js/if-inbounds-test.js"></script>