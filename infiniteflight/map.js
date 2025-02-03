let mapCanvas, ctx;
let aircraftPositions = {};  
let selectedAircraft = null;

const scale = 0.2;
let baseWidth;
const fixedHeight = 210; // Fixed height for the canvas

// Ensure canvas is 100% width but height remains fixed at 150px
function resizeCanvas() {
    baseWidth = mapCanvas.parentElement.clientWidth; // 100% of container
    const dpr = window.devicePixelRatio || 1;

    mapCanvas.width = baseWidth * dpr;
    mapCanvas.height = fixedHeight * dpr;

    mapCanvas.style.width = "100%";
    mapCanvas.style.height = `${fixedHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Initialize map
function initMap() {
    mapCanvas = document.getElementById("mapCanvas");
    ctx = mapCanvas.getContext("2d");
    resizeCanvas();
    drawBaseMap(); 
    setTimeout(() => showMapPopup(allFlights[0], airportCoordinates), 500);
}

// Convert latitude/longitude to X/Y coordinates
function convertToXY(lat, lon, airportLat, airportLon) {
    const centerX = mapCanvas.width * 0.25;
    const centerY = mapCanvas.height * 0.25; 

    const nmPerDegree = 60;

    // Compute distances
    const deltaLon = (lon - airportLon) * nmPerDegree * scale;
    const deltaLat = (lat - airportLat) * nmPerDegree * scale;

    // Transform to canvas coordinates
    const x = centerX + deltaLon;
    const y = centerY - deltaLat;

    return { x, y };
}

// Initialize real-time aircraft updates
document.addEventListener("DOMContentLoaded", () => {
    initMap();

    // Auto-update aircraft every second
    setInterval(() => {
        updateAircraftOnMap(getFlights(), airportCoordinates);
    }, 1000);
});

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

// Draw the base map with fixed-size rings
function drawBaseMap() {
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    // Dynamically adjust the center of the canvas
    const centerX = mapCanvas.width * 0.25;
    const centerY = mapCanvas.height * 0.25;

    // Draw rings at true center
    drawRing(50, "50nm", centerX, centerY);
    drawRing(200, "200nm", centerX, centerY);
    drawRing(500, "500nm", centerX, centerY);
}


// Draw rings with a consistent size
function drawRing(radius, label, centerX, centerY) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(label, centerX + radius * scale + 5, centerY);
}

// Update aircraft positions
function updateAircraftOnMap(flights, airport) {
    // Ensure the map is in view before clearing and redrawing
    const rect = mapCanvas.getBoundingClientRect();
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        drawBaseMap(); // Only clear when in view
    }

    let selectedFlight = null;
    
    flights.forEach(flight => {
        if (flight.latitude && flight.longitude) {
            const { x, y } = convertToXY(flight.latitude, flight.longitude, airport.latitude, airport.longitude);
            aircraftPositions[flight.flightId] = { x, y, flight };

            if (selectedAircraft === flight.flightId) {
                selectedFlight = { x, y, flight };
            } else {
                // Draw non-selected aircraft first (grey)
                ctx.fillStyle = "#828282";
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    // Always draw the selected flight last (red)
    if (selectedFlight) {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(selectedFlight.x, selectedFlight.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Show map popup
function showMapPopup(flight, airport) {
    document.getElementById("mapPopup").style.display = "block";
    selectedAircraft = flight.flightId;
    updateAircraftOnMap(getFlights(), airport);
}


// Adjust on window resize
window.addEventListener("resize", () => {
    resizeCanvas();
    drawBaseMap();
});

// Initialize real-time aircraft updates
document.addEventListener("DOMContentLoaded", () => {
    initMap();

    // Auto-update aircraft every second normally
    setInterval(() => {
        updateAircraftOnMap(getFlights(), airportCoordinates);
    }, 1000);

    // Attach scroll event to update aircraft ONLY when map is visible
    window.addEventListener("scroll", () => {
        const rect = mapCanvas.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
            updateAircraftOnMap(getFlights(), airportCoordinates);
        }
    });
});