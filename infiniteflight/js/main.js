import { showMap } from "/*/map.js";
import { allFlights } from "*/inbounds-test.js";

document.addEventListener("DOMContentLoaded", async () => {
    const flightsTable = document.getElementById("flightsTable");
    const mapContainer = document.getElementById("mapContainer");

    if (!flightsTable || !mapContainer) {
        console.error("Required elements not found in the DOM.");
        return;
    }

    // Ensure flights are loaded before allowing clicks
    let flights = [];
    try {
        flights = await getFlights();
        console.log("Flights loaded:", flights);
    } catch (error) {
        console.error("Error fetching flight data:", error);
    }

    // Click event to show the map when an aircraft row is clicked
    flightsTable.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        const callsign = row.cells[0]?.textContent.trim(); // Get callsign
        const flight = flights.find(f => f.callsign === callsign);

        if (flight) {
            console.log(`Showing map for flight: ${callsign}`, flight);
            showMap(flight);
        } else {
            console.warn(`Flight with callsign "${callsign}" not found.`);
        }
    });

    // Close Map Button
    const closeMapButton = document.getElementById("closeMapButton");
    if (closeMapButton) {
        closeMapButton.addEventListener("click", () => {
            mapContainer.style.display = "none";
        });
    }
});
