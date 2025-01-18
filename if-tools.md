---
layout: page
---

<div id=“searchContainer”>
<input type=“text” id=“icao” placeholder=“Enter ICAO code” maxlength=“4”>
<button id=“searchButton”>Search</button>
<div id=“countdownTimer” style=“display: none;”>Next update in: 60 seconds</div>
</div>

<form id=“filterForm” style=“margin-top: 20px;”>
<label for=“minHeading”>Min Heading:</label>
<input type=“number” id=“minHeading” min=“0” max=“360” placeholder=“e.g., 0”>
<label for=“maxHeading”>Max Heading:</label>
<input type=“number” id=“maxHeading” min=“0” max=“360” placeholder=“e.g., 90”>
<button type=“button” id=“boldHeadingButton”>Bold Aircraft</button>
<button type=“button” id=“toggleHeadingButton”>Hide/Show Other Aircraft</button>
<label for=“minDistance”>Min Distance:</label>
<input type=“number” id=“minDistance” min=“0” placeholder=“e.g., 50”>
<label for=“maxDistance”>Max Distance:</label>
<input type=“number” id=“maxDistance” min=“0” placeholder=“e.g., 500”>
<button type=“button” id=“applyDistanceFilterButton”>Apply Distance Filter</button>
</form>

<table id=“flightsTable”>
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
<!— Dynamic rows —>
</tbody>
</table>

<style>
body {
font-family: Arial, sans-serif;
margin: 20px;
line-height: 1.6;
}
#searchContainer {
margin-bottom: 20px;
}
input[type="text"] {
padding: 8px;
font-size: 14px;
width: 180px;
margin-right: 5px;
}
button {
padding: 8px 12px;
font-size: 14px;
cursor: pointer;
}
#countdownTimer {
margin-top: 10px;
font-size: 12px;
color: #555;
}
.filter-container {
margin-bottom: 20px;
}
.filter-container input {
width: 60px;
margin-right: 5px;
padding: 5px;
font-size: 12px;
}
.filter-container button {
padding: 6px 10px;
font-size: 12px;
margin-right: 5px;
}
table {
width: 100%;
border-collapse: collapse;
margin-top: 20px;
}
th, td {
border: 1px solid #ccc;
padding: 8px;
text-align: center;
}
th {
background-color: #f4f4f4;
}
#stopUpdateButton {
margin-top: 10px;
padding: 8px 12px;
display: none;
cursor: pointer;
}
</style>


<script src=“/js/if-tools.js”></script>