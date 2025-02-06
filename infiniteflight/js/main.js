import { getICAO } from "./icao.js";
import { inputSearch } from "./search.js";
import { getFlights, allFlights, airportCoordinates } from "./inbounds.js";
import { updateAircraftOnMap, resizeCanvas, drawBaseMap, selectedAircraft } from "./map.js";

document.getElementById("icao").addEventListener("input", inputSearch);

// Initialize real-time aircraft updates
document.addEventListener("DOMContentLoaded", () => {
    initMap();

    // Auto-update aircraft every second
    setInterval(() => {
        updateAircraftOnMap(getFlights(), airportCoordinates);
    }, 1000);
});

// Show map popup
function showMapPopup(flight, airport) {
    document.getElementById("mapPopup").style.display = "block";
    selectedAircraft = flight.flightId;
    updateAircraftOnMap(getFlights(), airport);
}

// Initialize map
function initMap() {
    mapCanvas = document.getElementById("mapCanvas");
    ctx = mapCanvas.getContext("2d");
    resizeCanvas();
    drawBaseMap(); 
    setTimeout(() => showMapPopup(allFlights[0], airportCoordinates), 500);

    mapCanvas.addEventListener("click", toggleScale);
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

    // Optimize scroll event to prevent blinking
    let isUpdating = false;

    window.addEventListener("scroll", () => {
        if (!isUpdating) {
            isUpdating = true;
            requestAnimationFrame(() => {
                const rect = mapCanvas.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    updateAircraftOnMap(getFlights(), airportCoordinates);
                }
                isUpdating = false;
            });
        }
    });
});
