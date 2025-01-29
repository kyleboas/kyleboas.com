import { showMap } from "/infiniteflight/js/map.js";
import { getFlights } from "/infiniteflight/test/inbounds-test.js";

document.addEventListener("DOMContentLoaded", () => {
    const flightsTable = document.getElementById("flightsTable");
    const mapContainer = document.getElementById("mapContainer");
    const flightCanvas = document.getElementById("flightCanvas");

    if (!flightsTable || !mapContainer || !flightCanvas) {
        console.error("Required elements not found in the DOM.");
        return;
    }

    // Click event to show the map when an aircraft row is clicked
    flightsTable.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        const callsign = row.cells[0]?.textContent.trim(); // Get callsign
        const flight = getFlights().find(f => f.callsign === callsign);

        if (flight) {
            showMap(flight);
        } else {
            console.warn(`Flight with callsign "${callsign}" not found.`);
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const closeMapButton = document.getElementById("closeMapButton");
    const mapContainer = document.getElementById("mapContainer");

    if (closeMapButton) {
        closeMapButton.addEventListener("click", () => {
            mapContainer.style.display = "none";
        });
    }
});