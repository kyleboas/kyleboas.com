console.log("autoUpdate.js - Importing");

import { fetchAndUpdateFlights } from "./flights.js";
console.log("autoUpdate.js - Imported: fetchAndUpdateFlights from flights.js");

import { fetchControllers } from "./atc.js";
console.log("autoUpdate.js - Imported: fetchControllers from atc.js");

import { fetchActiveATCAirports } from "./airport.js";
console.log("autoUpdate.js - Imported: fetchActiveATCAirports from airport.js");

import { renderATCTable, renderFlightsTable } from "./ui.js";
console.log("autoUpdate.js - Imported: renderATCTable & renderFlightsTable from ui.js");

import { state } from "./config.js";
console.log("autoUpdate.js - Imported: state from config.js");

console.log("autoUpdate.js - Successfully imported.");

// Stop auto-update
export function stopAutoUpdate() {
    if (state.updateInterval) clearInterval(state.updateInterval);
    if (state.updateTimeout) clearTimeout(state.updateTimeout);
    if (state.countdownInterval) clearInterval(state.countdownInterval);

    state.updateInterval = null;
    state.updateTimeout = null;
    state.countdownInterval = null;
    state.isAutoUpdateActive = false;

    // Update UI button state
    const updateButton = document.getElementById("update");
    if (updateButton) {
        updateButton.style.color = "#828282";
        const icon = updateButton.querySelector("i");
        if (icon) icon.classList.remove("spin");
    }

    console.log("Auto-update and interpolation stopped.");
}

// Start auto-update
export function startAutoUpdate(icao) {
    state.isAutoUpdateActive = true;
    const updateButton = document.getElementById("update");

    if (updateButton) {
        updateButton.style.color = "blue";
        const icon = updateButton.querySelector("i");
        if (icon) icon.classList.add("spin");
    }

    state.interpolateInterval = setInterval(async () => {
        try {
            interpolateNextPositions(state.airportCoordinates);
        } catch (error) {
            console.error("Error during interpolated flight updates:", error.message);

            if (error.message.includes("rate limit") || error.message.includes("fetch")) {
                alert("Rate limit or network error encountered. Flight updates stopped.");
                clearInterval(state.flightUpdateInterval);
            }
        }
    }, 1000);

    state.flightUpdateInterval = setInterval(async () => {
        try {
            await fetchAndUpdateFlights(icao);
        } catch (error) {
            console.error("Error during flight updates:", error.message);

            if (error.message.includes("rate limit") || error.message.includes("fetch")) {
                alert("Rate limit or network error encountered. Flight updates stopped.");
                clearInterval(state.flightUpdateInterval);
            }
        }
    }, 18000);

    state.atcUpdateInterval = setInterval(async () => {
        try {
            await fetchControllers(icao);
            await fetchActiveATCAirports();
            await renderATCTable();
        } catch (error) {
            console.error("Error during ATC updates:", error.message);

            if (error.message.includes("rate limit") || error.message.includes("fetch")) {
                alert("Rate limit or network error encountered. ATC updates stopped.");
                stopAutoUpdate();
            }
        }
    }, 60000);
}