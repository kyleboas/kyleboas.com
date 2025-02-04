---
Title: Infinite Flight Inbound Search
layout: infiniteflight-test
permalink: /test/inbounds/
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
      <p class="setting-title">Heading and Distance</p>
      <p class="setting-description-info">
        Input the minimum and maximum heading and distance to adjust what
        information is shown in the inbounds table.
      </p>
    </div>
   </div>
     <div class="HeadingFilter"> 
      <label class="settings-label" for="minHeading" style="margin-right: 12px;">Heading</label>
      <input
        type="number"
        id="minHeading"
        min="0"
        max="360"
        placeholder="MIN"
        aria-label="MAX"
      />
      <input
        type="number"
        id="maxHeading"
        min="0"
        max="360"
        placeholder="MIN"
        aria-label="MAX"
      />
     </div> 
     <div class="DistanceFilter"> 
      <label class="settings-label" for="minDistance">Distance</label>
      <input
        type="number"
        id="minDistance"
        min="0"
        placeholder="MIN"
        aria-label="MAX"
      />
      <input
        type="number"
        id="maxDistance"
        min="0"
        placeholder="MIN"
        aria-label="MAX"
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
     
     <div class="setting-container">
     <div class="setting-border" id="applyDistanceFilterBorder">
      <button class="overlay-button" id="applyDistanceFilterButton"></button>    
      <span class="setting-button"></span>
      <p class="setting-title">Distance Filter</p>
      <p class="setting-description">
        Filter the table to exclude aircraft outside the distance range.
      </p>
    </div>
    </div>
    
    <div class="setting-container">
     <div class="setting-border" id="filterHeadingHighlightBorder">
      <button class="overlay-button" id="filterHeadingHighlightButton"></button>    
      <p class="setting-title">Split Filter</p>
      <p class="setting-description">
        When enabled, aircraft are separated by heading range. When disabled, all aircraft are compared regardless of direction. Enable this for multiple runways; disable this for single runway airports.
      </p>
     </div>
     </div>
     
  <div class="setting-information">
   <div class="setting-container">
    <div class="setting">
      <p class="setting-title">Key</p>
      <table id="keyTable" style="margin-top: 10px;">
        <thead>
            <tr>
                <th>Aircraft</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>N623KB<br><small>A320</small></td>
                <td class="table-description">Aircraft's callsign and aircraft type.</td>
            </tr>
         </tbody>
       </table>
       <table id="keyTable">
        <thead>
            <tr>
                <th>MIN/MAX</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>0.70<br>0.82</td>
                <td class="table-description">Aircraft type's minimum and maximum Mach speed.</td>
            </tr>
         </tbody>
       </table>
       <table id="keyTable">
        <thead>
            <tr>
                <th>MIN/MAX</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>445knts<br>0.67</td>
                <td class="table-description">Ground speed and Mach speed, not based off autopilot.</td>
            </tr>
         </tbody>
       </table>
        <table id="keyTable">
        <thead>
            <tr>
                <th>HDG/ALT</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>49<span class="arrow is-northeast"></span><br>37000ft</td>
                <td class="table-description">Heading from the airport to the aircraft and altitude (MSL).</td>
            </tr>
         </tbody>
       </table>
        <table id="keyTable">
        <thead>
            <tr>
                <th>NM/ETA</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>288nm<br>38:49</td>
                <td class="table-description">Distance to Destination and Estimated Time of Arrival.</td>
            </tr>
         </tbody>
       </table>
      <p class="setting-title" style="margin-top: 20px;">Separation</p>
      <p class="setting-description">
        The table is color coded based on ETA (Estimated Time of Arrival) separation.
      </p>
      <div class="box-container" style="margin-top: 20px;">
        <div class="box" style="background-color:#fffa9f;"></div>
        <p class="setting-description">10 seconds separation</p>
      </div>
      <div class="box-container">
        <div class="box" style="background-color:#80daeb;"></div>
        <p class="setting-description">30 seconds separation</p>
      </div>
      <div class="box-container">
        <div class="box" style="background-color:#daceca;"></div>
        <p class="setting-description">60 seconds separation</p>
      </div>
      <div class="box-container" style="margin-bottom: 20px;">
        <div class="box" style="background-color:#eaeaea;"></div>
        <p class="setting-description">120 seconds separation</p>
      </div>
     <p class="setting-description" style="margin-bottom: 20px;">
        If you do not have any filters enabled, all inbounds will be shown. This is an example of how the color highlights are applied.
      </p> 
      <table id="infoTable">
        <thead>
            <tr>
                <th>Aircraft</th>
                <th>Heading</th>
                <th>NM/ETA</th>
                <th>Color</th>
            </tr>
        </thead>
        <tbody>
            <tr class="yellow-highlight">
                <td>N623KB</td>
                <td>30</td>
                <td>30:10</td>
                <td>Yellow</td>
            </tr>
            <tr class="yellow-highlight">
                <td>AAL34</td>
                <td>170</td>
                <td>30:15</td>
                <td>Yellow</td>
            </tr>
            <tr class="blue-highlight">
                <td>NT3</td>
                <td>182</td>
                <td>30:30</td>
                <td>Blue</td>
            </tr>
            <tr class="beige-highlight">
                <td>DAL24</td>
                <td>310</td>
                <td>30:70</td>
                <td>Beige</td>
            </tr> 
         </tbody>
       </table>
      <p class="setting-description" style="margin-top: 20px;"> 
        If you enable the <strong>Split Filter</strong> the highlighted colors will change dependent on your heading settings. For example, if you wanted to see what the separation of the aircraft from the North compared to the South, you would set the minimum heading to 90 and maximum heading to 270. This is what the same table will look like. N623KB is compared to DAL24 and AAL34 is compared to NT3.
      </p>
      <table id="infoTable">
        <thead>
            <tr>
                <th>Aircraft</th>
                <th>Heading</th>
                <th>NM/ETA</th>
                <th>Color</th>
            </tr>
        </thead>
        <tbody>
            <tr class="beige-highlight">
                <td>N623KB</td>
                <td>30</td>
                <td>30:10</td>
                <td>Beige</td>
            </tr>
            <tr class="blue-highlight">
                <td>AAL34</td>
                <td>170</td>
                <td>30:15</td>
                <td>Blue</td>
            </tr>
            <tr class="blue-highlight">
                <td>NT3</td>
                <td>182</td>
                <td>30:30</td>
                <td>Blue</td>
            </tr>
            <tr class="beige-highlight">
                <td>DAL24</td>
                <td>310</td>
                <td>30:70</td>
                <td>Beige</td>
            </tr> 
         </tbody>
       </table>
       <p class="setting-description" style="margin-top: 20px;">
        Each aircraft's Distance to Destination (NM) and Estimated Time of Arrival will be updated every second, based on projected position. Their ground speed, mach speed, heading, altitude, and actual position will update every 20 seconds.
      </p>
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
           minlength="4" 
           required
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
    
    <table id="schedule">
        <thead>
            <tr>
                <th>Day</th>
                <th>Feb 3</th>
                <th>Feb 4</th>
                <th>Feb 5</th>
                <th>Feb 6</th>
                <th>Feb 7</th>
                <th>Feb 8</th>
                <th>Feb 9</th>
                <th>Feb 10</th>
                <th>Feb 11</th>
                <th>Feb 12</th>
                <th>Feb 13</th>
                <th>Feb 14</th>
                <th>Feb 15</th>
                <th>Feb 16</th>
                <th>Feb 17</th>
                <th>Feb 18</th>
                <th>Feb 19</th>
                <th>Feb 20</th>
                <th>Feb 21</th>
                <th>Feb 22</th>
                <th>Feb 23</th>
                <th>Feb 24</th>
                <th>Feb 25</th>
                <th>Feb 26</th>
                <th>Feb 27</th>
                <th>Feb 28</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Featured Route</th>
                <td>MPTO-SPJC</td>
                <td>SPJC-SCEL</td>
                <td>SCEL-SBGL</td>
                <td>SBGL-KMIA</td>
                <td>KMIA-CYYZ</td>
                <td>CYYZ-KJFK</td>
                <td>KJFK-EGLL</td>
                <td>EGLL-LIRF</td>
                <td>LIRF-LTFM</td>
                <td>LTFM-HECA</td>
                <td>HECA-HAAB</td>
                <td>HAAB-FAOR</td>
                <td>FAOR-OMDB</td>
                <td>OMDB-VABB</td>
                <td>VABB-VCBI</td>
                <td>VCBI-WSSS</td>
                <td>WSSS-YSSY</td>
                <td>YSSY-VHHH</td>
                <td>VHHH-ZBAA</td>
                <td>ZBAA-RKSI</td>
                <td>RKSI-RJAA</td>
                <td>RJAA-PHNL</td>
                <td>PHNL-KSEA</td>
                <td>KSEA-CYYC</td>
                <td>CYYC-KSFO</td>
                <td>KSFO-KLAX</td>
            </tr>
            <tr>
                <th>Additional Airports</th>
                <td>SKBO, SVMI, SKCL</td>
                <td>SLVR, SPZO, SCFA</td>
                <td>SBGR, SAEZ, SBKP</td>
                <td>SBBR, TJSJ, MYNN</td>
                <td>KLGA, KATL, KORD</td>
                <td>KBOS, KPHL, CYUL</td>
                <td>BIKF, EIDW, EHAM</td>
                <td>LFPG, EDDF, LSZH</td>
                <td>LGAV, LTAI, LGIR</td>
                <td>OJAI, OEJN, UBBB</td>
                <td>HKJK, HRYR, HTDA</td>
                <td>FACT, FMMI, FMEE</td>
                <td>OTHH, OKKK, OERK</td>
                <td>VCBI, OPIS, OOMS</td>
                <td>VNKT, VECC, VTBS</td>
                <td>VVTS, VVDN, WIII</td>
                <td>YBBN, AYPY, WADD</td>
                <td>RPLL, RCTP, YBCS</td>
                <td>ZUUU, ZSPD, RCKH</td>
                <td>RKPC, ZSSS, RPVM</td>
                <td>RKPK, RJCC, ZBAD</td>
                <td>PHTO, PHOG, PHKO</td>
                <td>CYVR, KPDX, KSFO</td>
                <td>CYEG, KSLC</td>
                <td>KDFW, KMSP, KSAN</td>
                <td>KDEN, KLAS, KAUS</td>
            </tr>
        </tbody>
    </table>
    
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
                <th colspan="5" class="map-container">
                    <div id="mapPopup">
                        <canvas id="mapCanvas"></canvas>
                    </div>
                </th>
            </tr>
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