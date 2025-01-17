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
    <form id="searchForm">
        <label for="icao">Enter Airport ICAO:</label>
        <input type="text" id="icao" name="icao" placeholder="e.g., KLAX" required>
        <button type="submit">Search</button>
    </form>
    <table id="flightsTable">
        <thead>
            <tr>
                <th>Heading</th>
                <th>Ground Speed (kts)</th>
                <th>Mach Speed</th>
                <th>Altitude (ft)</th>
                <th>Distance to Destination (nm)</th>
                <th>ETA (minutes)</th>
            </tr>
        </thead>
        <tbody>
            <!-- Rows will be inserted dynamically -->
        </tbody>
    </table>
</div>
<script src="if.js"></script>
</body>