import { fetchAirportData } from "./airport.js";
import { getFlights, allFlights, airportCoordinates } from "./inbounds.js";

let mapCanvas, ctx;
let aircraftPositions = {};  
let selectedAircraft = null;

const scaleOptions = [0.2, 0.5, 1.8, 0.14];
let scaleIndex = 0;
let scale = scaleOptions[scaleIndex]; 
let baseWidth;
const fixedHeight = 210;

// Center point of the canvas - defined as constants for consistency
// Using 0.5 ensures the airport is properly centered on all browsers
const CENTER_X_FACTOR = 0.5;
const CENTER_Y_FACTOR = 0.5;

// Ensure canvas is 100% width but height remains fixed
function resizeCanvas() {
    baseWidth = mapCanvas.parentElement.clientWidth; // 100% of container
    const dpr = window.devicePixelRatio || 1;

    mapCanvas.width = baseWidth * dpr;
    mapCanvas.height = fixedHeight * dpr;

    mapCanvas.style.width = "100%";
    mapCanvas.style.height = `${fixedHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function toggleScale() {
    scaleIndex = (scaleIndex + 1) % scaleOptions.length;
    scale = scaleOptions[scaleIndex];

    drawBaseMap();
    updateAircraftOnMap(getFlights(), airportCoordinates);
}

// Convert latitude/longitude to X/Y coordinates
function convertToXY(lat, lon, airportLat, airportLon) {
    // Use consistent center coordinates based on the defined factors
    const centerX = mapCanvas.width * CENTER_X_FACTOR;
    const centerY = mapCanvas.height * CENTER_Y_FACTOR; 

    const nmPerDegree = 60;

    const deltaLon = (lon - airportLon) * nmPerDegree * scale;
    const deltaLat = (lat - airportLat) * nmPerDegree * scale;

    const x = centerX + deltaLon;
    const y = centerY - deltaLat;  // Note: y decreases as latitude increases

    return { x, y };
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

async function drawILSPaths() {
    const airportData = await fetchAirportData();
    if (!airportData || !airportData.runways) return;

    airportData.runways.forEach(runway => {
        drawILS(runway.le_latitude_deg, runway.le_longitude_deg, runway.le_heading_degT);
        drawILS(runway.he_latitude_deg, runway.he_longitude_deg, runway.he_heading_degT);
    });
}

function drawILS(lat, lon, heading) {
    const nmPerDegree = 60;
    const ilsLength = 13; // 13 NM ILS path
    const ilsSegments = 13; // One dash per NM

    const ilsEndLat = lat + (ilsLength / nmPerDegree) * Math.cos((heading * Math.PI) / 180);
    const ilsEndLon = lon + (ilsLength / nmPerDegree) * Math.sin((heading * Math.PI) / 180);

    const start = convertToXY(lat, lon, airportCoordinates.latitude, airportCoordinates.longitude);
    const end = convertToXY(ilsEndLat, ilsEndLon, airportCoordinates.latitude, airportCoordinates.longitude);

    ctx.setLineDash([5, 5]); // Dashed line: 5px on, 5px off
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash style
}

// Draw the base map with fixed-size rings
function drawBaseMap() {
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    // Use the same center coordinates as in convertToXY for consistency
    const centerX = mapCanvas.width * CENTER_X_FACTOR;
    const centerY = mapCanvas.height * CENTER_Y_FACTOR;

    // Draw rings at true center
    drawRing(50, "", centerX, centerY);
    drawRing(200, "", centerX, centerY);
    drawRing(500, "", centerX, centerY);
    
    drawILSPaths();
}

// Draw rings with a consistent size
function drawRing(radius, label, centerX, centerY) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
    
    // Get the stroke color from the CSS class
    const ringElement = document.querySelector(".ring-color");
    if (ringElement) {
        ctx.strokeStyle = getComputedStyle(ringElement).stroke;
    } else {
        ctx.strokeStyle = "grey"; // Fallback color
    }
    
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillText(label, centerX + radius * scale + 5, centerY);
}

// Store last known aircraft positions to handle errors
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
                    ctx.fillStyle = "#828282";
                    ctx.beginPath();
                    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }

                let aircraftElement = document.getElementById(`flight-${flight.flightId}`);

                if (!aircraftElement) {
                    aircraftElement = document.createElement("div");
                    aircraftElement.id = `flight-${flight.flightId}`;
                    aircraftElement.className = "aircraft";
                    mapCanvas.appendChild(aircraftElement);
                }

                // Update position without re-adding the element
                aircraftElement.style.transform = `translate(${x}px, ${y}px)`;
            }
        });

        // Highlight selected flight
        if (selectedFlight) {
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(selectedFlight.x, selectedFlight.y, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
    } catch (error) {
        console.error("Error updating aircraft positions:", error);

        // Restore last known positions if an error occurs
        if (Date.now() - lastUpdateTime < positionTimeout) {
            console.warn("Using last known positions due to error");
            Object.values(lastKnownPositions).forEach(({ x, y, flight }) => {
                ctx.fillStyle = flight.flightId === selectedAircraft ? "blue" : "#828282";
                ctx.beginPath();
                ctx.arc(x, y, 2.2, 0, Math.PI * 2);
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

function initMap() {
    mapCanvas = document.getElementById("mapCanvas");
    if (!mapCanvas) {
        console.error("Error: mapCanvas not found in the DOM.");
        return;
    }

    ctx = mapCanvas.getContext("2d");
    resizeCanvas();
    drawBaseMap(); 
    setTimeout(() => showMapPopup(allFlights[0], airportCoordinates), 500);

    mapCanvas.addEventListener("click", toggleScale);

    let lastTouchEnd = 0;
    mapCanvas.addEventListener("touchend", (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

export { initMap, showMapPopup, updateAircraftOnMap, resizeCanvas, drawBaseMap, selectedAircraft };