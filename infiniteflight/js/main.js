import { getICAO } from "./icao.js";
import { inputSearch } from "./search.js";
import { getFlights, allFlights, airportCoordinates } from "./inbounds.js";
import { initMap, updateAircraftOnMap, resizeCanvas, drawBaseMap, selectedAircraft } from "./map.js";
import { updateRunwaySpacingDisplay } from "./spacing.js";

document.getElementById("icao").addEventListener("input", inputSearch);

// Initialize real-time aircraft updates
document.addEventListener("DOMContentLoaded", () => {
    initMap();

    // Auto-update aircraft every second normally
    setInterval(() => {
        updateAircraftOnMap(getFlights(), airportCoordinates);
        updateRunwaySpacingDisplay();
    }, 1000);

    // Optimize scroll event to prevent blinking
    let isUpdating = false;

    window.addEventListener("scroll", () => {
        if (!isUpdating) {
            isUpdating = true;
            requestAnimationFrame(() => {
                const mapCanvas = document.getElementById("mapCanvas");
                const rect = mapCanvas.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    updateAircraftOnMap(getFlights(), airportCoordinates);
                }
                isUpdating = false;
            });
        }
    });
});

// Adjust on window resize
window.addEventListener("resize", () => {
    resizeCanvas();
    drawBaseMap();
});