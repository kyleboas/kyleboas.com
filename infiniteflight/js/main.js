import { fetchActiveATCAirports } from "./airport.js";
import { renderATCTable } from "./ui.js";
import { fetchAndUpdateFlights } from "./flights.js";
import { startAutoUpdate, stopAutoUpdate } from "./autoUpdate.js";
import { state } from "./config.js";

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    applyDefaults();

    try {
        await fetchActiveATCAirports();
        await renderATCTable();
    } catch (error) {
        console.error("Error initializing ATC table:", error.message);
    }

    const searchButton = document.getElementById("search");
    const icaoInput = document.getElementById("icao");
    const updateButton = document.getElementById("update");

    async function handleSearch() {
        const icao = icaoInput.value.trim().toUpperCase();
        if (!icao) {
            alert("Please enter a valid ICAO code.");
            return;
        }

        stopAutoUpdate();

        state.allFlights = [];
        state.interpolatedFlights = [];
        state.airportCoordinates = null;
        state.lastApiUpdateTime = null;

        const tableBody = document.querySelector("#flightsTable tbody");
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
        }

        try {
            await fetchAndUpdateFlights(icao);
            startAutoUpdate(icao);
        } catch (error) {
            console.error("Error during search:", error.message);
            alert("Failed to fetch and update flights. Please try again.");
        }
    }

    if (searchButton) {
        searchButton.addEventListener("click", handleSearch);
    }

    if (icaoInput) {
        icaoInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await handleSearch();
            }
        });
    }

    if (updateButton) {
        updateButton.addEventListener("click", () => {
            const icao = icaoInput.value.trim().toUpperCase();
            if (!icao) {
                alert("Please enter a valid ICAO code before updating.");
                return;
            }

            if (state.isAutoUpdateActive) {
                stopAutoUpdate();
            } else {
                startAutoUpdate(icao);
            }
        });
    }
});