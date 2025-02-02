let mapCanvas, ctx;
let aircraftPositions = {};  
let selectedAircraft = null;
let scale = 0.4;

// Ensure the canvas is square
function resizeCanvas() {
    mapCanvas.width = Math.min(window.innerWidth * 0.6, 600); 
    mapCanvas.height = mapCanvas.width; // Keep it square
}

// Initialize map
function initMap() {
    mapCanvas = document.getElementById("mapCanvas");
    ctx = mapCanvas.getContext("2d");
    resizeCanvas();
    drawBaseMap();
}

// Convert latitude/longitude to X/Y coordinates
function convertToXY(lat, lon, airportLat, airportLon) {
    const nmPerDegree = 60; 
    const dx = (lon - airportLon) * nmPerDegree * scale;
    const dy = (lat - airportLat) * nmPerDegree * scale;

    return { x: mapCanvas.width / 2 + dx, y: mapCanvas.height / 2 - dy };
}

// Calculate distance using the Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 3440.065; 
    const toRad = Math.PI / 180;
    
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
              Math.sin(dLon / 2) ** 2;
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Draw the base map with centered rings
function drawBaseMap() {
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    // Draw airport at the center
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(mapCanvas.width / 2, mapCanvas.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw distance rings
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    drawRing(50, "50nm");
    drawRing(200, "200nm");
    drawRing(500, "500nm");
}

// Draw rings dynamically
function drawRing(radius, label) {
    ctx.beginPath();
    ctx.arc(mapCanvas.width / 2, mapCanvas.height / 2, radius * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(label, mapCanvas.width / 2 + radius * scale + 5, mapCanvas.height / 2);
}

// Update aircraft positions
function updateAircraftOnMap(flights, airport) {
    drawBaseMap(); 
    
    flights.forEach(flight => {
        if (flight.latitude && flight.longitude) {
            const distance = getDistance(flight.latitude, flight.longitude, airport.latitude, airport.longitude);

            if (distance <= 500) {
                const { x, y } = convertToXY(flight.latitude, flight.longitude, airport.latitude, airport.longitude);

                aircraftPositions[flight.flightId] = { x, y, flight };

                ctx.fillStyle = (selectedAircraft === flight.flightId) ? "red" : "blue";
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

// Show the map popup
function showMapPopup(flight, airport) {
    document.getElementById("mapPopup").style.display = "block";
    selectedAircraft = flight.flightId;
    updateAircraftOnMap(allFlights, airport);
}

// Adjust on window resize
window.addEventListener("resize", () => {
    resizeCanvas();
    drawBaseMap();
});

// Initialize map when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    initMap();
});