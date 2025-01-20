---
layout: page
---

<style>
body {
    font-family: Helvetica, sans-serif;
    margin: 20px;
    line-height: 1.6;
}

.container {
    max-width: 800px;
    margin: auto;
}

pre {
    font-family: Helvetica, sans-serif;
    font-size: 12px;
    padding-top: 0px;
    padding-top: 0px;
}

.dropdown {
    position: relative;
    display: inline-block;
}

.dropdown-toggle {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    font-size: 14px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.dropdown-menu {
    display: none;
    position: absolute;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    z-index: 1;
    width: 260px;
}

.dropdown:hover .dropdown-menu {
    display: block;
}

.dropdown-menu input,
.dropdown-menu button {
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 8px;
    width: 100%;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 240px;
}

.dropdown-menu button {
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    margin-top: 15px;
}

.dropdown-menu button:hover {
    background-color: #45a049;
}

form {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
}

form input[type="text"], 
form input[type="number"], 
form button {
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

form button {
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

form button:hover {
    background-color: #45a049;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    text-align: center;
}

tbody {
    font-size: 12px; 
}

thead th {
    padding: 5px;
    text-align: center;
    position: sticky;
    top: 0; 
    background-color: #f2f2f2;
    z-index: 1;
} 

tbody td {
    padding: 5px;
}

th, td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: center;
    font-size: 12px;
}

th {
    background-color: #f4f4f4;
    font-weight: bold;
}

#atisMessage, #controllersList {
    margin-top: 15px;
    padding: 10px;
    border-left: 4px solid #4CAF50;
    border-radius: 4px;
    font-size: 15px;
}
</style>

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
        <label for="defaultMinHeading">Default Min Heading:</label>
        <input type="number" id="defaultMinHeading" min="0" max="360" placeholder="e.g., 0">
        <br>
        <label for="defaultMaxHeading">Default Max Heading:</label>
        <input type="number" id="defaultMaxHeading" min="0" max="360" placeholder="e.g., 90">
        <br>
        <label for="defaultMinDistance">Default Min Distance:</label>
        <input type="number" id="defaultMinDistance" min="0" placeholder="e.g., 50">
        <br>
        <label for="defaultMaxDistance">Default Max Distance:</label>
        <input type="number" id="defaultMaxDistance" min="0" placeholder="e.g., 500">
        <br>
        <button type="button" id="saveDefaultsButton">Save Defaults</button>
    </div>
</div>

    <!-- Filter Form -->
    <form id="filterForm" style="margin-top: 20px;">
        <label for="minHeading">Min Heading:</label>
        <input type="number" id="minHeading" min="0" max="360" placeholder="e.g., 0">
        <label for="maxHeading">Max Heading:</label>
        <input type="number" id="maxHeading" min="0" max="360" placeholder="e.g., 90">
        <button type="button" id="boldHeadingButton">Bold Aircraft</button>
        <button type="button" id="toggleHeadingButton">Hide/Show Other Aircraft</button>
        
    <label for="minDistance">Min Distance:</label>
    <input type="number" id="minDistance" min="0" placeholder="e.g., 50">
    <label for="maxDistance">Max Distance:</label>
    <input type="number" id="maxDistance" min="0" placeholder="e.g., 500">
    <button type="button" id="applyDistanceFilterButton">Apply Distance Filter</button>
    <button type="button" id="resetDistanceFilterButton">Reset Filter</button>
    <button type="button" id="filterHeadingHighlightButton">Filter Highlight by Heading</button>
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
<script src="/js/if-inbound.js"></script>
</body>