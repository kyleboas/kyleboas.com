let mapCanvas, ctx;
let aircraftPositions = {};  // Store aircraft positions
let selectedAircraft = null;

// Initialize map when the popup is opened
function initMap() {
    mapCanvas = document.getElementById("mapCanvas");
    ctx = mapCanvas.getContext("2d");
    drawBaseMap();
}

// Convert latitude/longitude to X/Y coordinates
function convertToXY(lat, lon, airportLat, airportLon) {
    const scale = 2; // 1 nm = 2 pixels
    const nmPerDegree = 60; // Approximate nm per lat/lon degree

    const dx = (lon - airportLon) * nmPerDegree * scale;
    const dy = (lat - airportLat) * nmPerDegree * scale;

    return { x: 300 + dx, y: 300 - dy }; // Center at (300,300)
}

// Draw Base Map with Distance Rings
function drawBaseMap() {
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    // Draw Airport at Center
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(300, 300, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Distance Rings
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    drawRing(50, "50nm");
    drawRing(200, "200nm");
    drawRing(500, "500nm");
}

// Helper function to draw rings
function drawRing(radius, label) {
    const scale = 2;
    ctx.beginPath();
    ctx.arc(300, 300, radius * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(label, 300 + radius * scale + 5, 300);
}

// Update Aircraft Positions
function updateAircraftOnMap(flights, airport) {
    drawBaseMap(); // Redraw the base map
    
    flights.forEach(flight => {
        if (flight.latitude && flight.longitude) {
            const { x, y } = convertToXY(flight.latitude, flight.longitude, airport.latitude, airport.longitude);

            aircraftPositions[flight.flightId] = { x, y, flight };

            ctx.fillStyle = (selectedAircraft === flight.flightId) ? "red" : "blue";
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Show the Map Popup
function showMapPopup(flight, airport) {
    document.getElementById("mapPopup").style.display = "block";
    selectedAircraft = flight.flightId;
    updateAircraftOnMap(allFlights, airport);
}

// Initialize Map
document.addEventListener("DOMContentLoaded", () => {
    initMap();
});