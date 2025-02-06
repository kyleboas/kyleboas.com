import { getICAO } from "./icao.js";
import { inputSearch } from "./search.js";
import { getFlights, allFlights, airportCoordinates } from "./inbounds.js";
import { initMap, updateAircraftOnMap, resizeCanvas, drawBaseMap, selectedAircraft } from "./map.js";
import { updateRunwaySpacingDisplay } from "./spacing.js";

// Attach event listeners to the search button and input field
document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.getElementById("searchButton");
    const icaoInput = document.getElementById("icao");

    if (searchButton) {
        searchButton.addEventListener("click", async () => {
            await inputSearch();
        });
    }

    if (icaoInput) {
        icaoInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await inputSearch();
            }
        });
    }
});

// Initialize real-time aircraft updates
document.addEventListener("DOMContentLoaded", async () => {
    // Set up ICAO input handler
    const icaoInput = document.getElementById("icao");
    if (icaoInput) {
        // Set initial value from session storage if exists
        const storedICAO = getICAO();
        if (storedICAO) {
            icaoInput.value = storedICAO;
            await inputSearch(); // Trigger initial search
        }
        
        // Add input event listener
        icaoInput.addEventListener("input", inputSearch);
    }

    initMap();

    // Auto-update aircraft every second normally
    setInterval(async () => {
        const currentICAO = getICAO();
        if (currentICAO) {
            updateAircraftOnMap(getFlights(), airportCoordinates);
            await updateRunwaySpacingDisplay();
        }
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

setInterval(updateRunwaySpacingDisplay, 5000);