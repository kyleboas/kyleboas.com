---
layout: page
---

<body>
<div class="container">
    <h1>Search Inbound Flights</h1>
    
    <div id="activeAtcAirports" style="font-size: 15px;">
    <pre id="atcAirportsList">Fetching data...</pre>
</div>

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
        <input type="number" id="minHeading" min="0" max="360" placeholder="Minimum e.g., 0">
        <input type="number" id="maxHeading" min="0" max="360" placeholder="Maximum e.g., 90">
        <button type="button" id="boldHeadingButton">Bold Aircraft</button>
        <button type="button" id="toggleHeadingButton">Hide/Show Other Aircraft</button>
        
    <input type="number" id="minDistance" min="0" placeholder="Minimum e.g., 50">
    <input type="number" id="maxDistance" min="0" placeholder="Maximum e.g., 500">
    <button type="button" id="applyDistanceFilterButton">Apply Distance Filter</button>
    <button type="button" id="resetDistanceFilterButton">Reset Filter</button>
    <button type="button" id="filterHeadingHighlightButton">Enable Highlight by Heading</button>
    </form>
    
    <button id="manualUpdateButton">Update ATIS and Controllers</button>
    
    <div id="atisMessage" style="display: none;">ATIS: Not fetched yet</div>

<div>    
    <pre id="controllersList" style="display: none;">No active ATC.</pre>
</div>

    <button type="button" id="updateButton">Update</button>
    <button type="button" id="stopUpdateButton" style="display: none;">Stop Update</button>
    <span id="countdownTimer" style="display: none;"></span>
    
    <table id="flightsTable">
    <thead>
        <tr>
            <th>Aircraft</th>
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
<link rel="stylesheet" type="text/css" href="{{ site.baseurl }}/infiniteflight.css" />
<script src="/js/if-inbound.js"></script>
</body>