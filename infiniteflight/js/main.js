import { showMap } from "./map.js";
import { AutoUpdate } from "./AutoUpdate.js";
import { 
        updateButton,
        fetchAndUpdateFlights,
        interpolateNextPositions,
        fetchControllers,
        fetchActiveATCAirports,
        renderATCTable 
 } from "./inbounds-test.js";

let flights = []; // Store fetched flights globally for reuse

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded.");

    // Select necessary DOM elements
    const flightsTable = document.getElementById("flightsTable");
    const mapContainer = document.getElementById("mapContainer");
    const closeMapButton = document.getElementById("closeMapButton");
    const updateButton = document.getElementById("update");
    const icaoInput = document.getElementById("icao");

    // Validate essential elements
    if (!flightsTable || !mapContainer || !updateButton || !icaoInput) {
        console.error("Required elements not found in the DOM.");
        return;
    }

    // Fetch flight data on load
    try {
        flights = await getFlights();
        console.log("Flights loaded:", flights);
    } catch (error) {
        console.error("Error fetching flights:", error);
    }

    // Handle flight row clicks to show map
    flightsTable.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        const callsign = row.cells[0]?.textContent.trim();
        const flight = flights.find(f => f.callsign === callsign);

        if (flight) {
            console.log(`Showing map for flight: ${callsign}`, flight);
            showMap(flight);
        } else {
            console.warn(`Flight "${callsign}" not found.`);
        }
    });

    // Close map when close button is clicked
    if (closeMapButton) {
        closeMapButton.addEventListener("click", () => {
            mapContainer.style.display = "none";
        });
    }

    // Initialize auto-update manager
    const autoUpdate = new AutoUpdate (
        updateButton,
        fetchAndUpdateFlights,
        interpolateNextPositions,
        fetchControllers,
        fetchActiveATCAirports,
        renderATCTable
    );

    // Handle update button clicks
    updateButton.addEventListener("click", () => {
        const icao = icaoInput.value.trim().toUpperCase();

        if (!icao) {
            alert("Please enter a valid ICAO code before updating.");
            return;
        }

        if (autoUpdate.isAutoUpdateActive) {
            autoUpdate.stop();
        } else {
            autoUpdate.start(icao);
        }
    });
});