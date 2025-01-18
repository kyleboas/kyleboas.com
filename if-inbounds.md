---
layout: page
---

<style>
body {
    font-family: Arial, sans-serif;
    margin: 20px;
}
.container {
    max-width: 800px;
    margin: auto;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}
th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}
th {
    background-color: #f4f4f4;
}
</style>

<body>
<div class="container">
    <h1>Search Inbound Flights</h1>
    <!-- Search Form -->
    <form id="searchForm" novalidate>
        <label for="icao">Enter Airport ICAO:</label>
        <input type="text" id="icao" name="icao" placeholder="Enter ICAO" required>
        <button type="submit">Search</button>
    </form>
    <button type="button" id="updateButton">Update</button>
    <button type="button" id="stopUpdateButton" style="display: none;">Stop Update</button>
    <span id="countdownTimer" style="display: none;">Next update in: 60 seconds</span>

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
    </form>
    
    <div id="atisMessage" style="margin-top: 10px; font-weight: bold;">ATIS: Not fetched yet</div>

    <table id="flightsTable">
        <thead>
            <tr>
                <th>Callsign</th>
                <th>Heading</th>
                <th>Ground Speed (kts)</th>
                <th>Mach Speed</th>
                <th>Altitude (ft)</th>
                <th>Distance to Destination (nm)</th>
                <th>ETA (minutes)</th>
            </tr>
        </thead>
        <tbody>
            <!-- Dynamic rows -->
        </tbody>
    </table>
</div>
<script src="/js/if-inbound.js"></script>
</body>