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
    
    // Dynamically adjust the center of the canvas
    const centerX = mapCanvas.width * 0.25;
    const centerY = mapCanvas.height * 0.25;

    // Draw rings at true center
    drawRing(50, "", centerX, centerY);
    drawRing(200, "", centerX, centerY);
    drawRing(500, "", centerX, centerY);
}


// Draw rings with a consistent size
function drawRing(radius, label, centerX, centerY) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(label, centerX + radius * scale + 5, centerY);
}

// Update aircraft positions
let lastKnownPositions = {};
let lastUpdateTime = Date.now();
const positionTimeout = 5000;

function updateAircraftOnMap(flights, airport) {
    try {
        drawBaseMap();
        let selectedFlight = null;

        flights.forEach(flight => {
            if (flight.latitude && flight.longitude) {
                const { x, y } = convertToXY(flight.latitude, flight.longitude, airport.latitude, airport.longitude);

                aircraftPositions[flight.flightId] = { x, y, flight };
                lastKnownPositions[flight.flightId] = { x, y, flight };
                lastUpdateTime = Date.now();

                if (selectedAircraft === flight.flightId) {
                    selectedFlight = { x, y, flight };
                } else {
                    ctx.fillStyle = "grey";
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        if (selectedFlight) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(selectedFlight.x, selectedFlight.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    } catch (error) {
        console.error("Error updating aircraft positions:", error);

        // If an error occurs, restore last known positions for 5 seconds
        if (Date.now() - lastUpdateTime < positionTimeout) {
            console.warn("Using last known positions due to error");
            Object.values(lastKnownPositions).forEach(({ x, y, flight }) => {
                ctx.fillStyle = flight.flightId === selectedAircraft ? "blue" : "#828282";
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
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

    // Debounced scroll event to prevent lag and excessive updates
    let lastScrollTime = 0;
    const scrollDelay = 250; // Adjust delay for performance

    window.addEventListener("scroll", () => {
        const now = Date.now();
        if (now - lastScrollTime > scrollDelay) {
            lastScrollTime = now;
            const rect = mapCanvas.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                updateAircraftOnMap(getFlights(), airportCoordinates);
            }
        }
    });
});