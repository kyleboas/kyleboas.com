import { applyDefaults } from './defaults.js';
import { fetchActiveATCAirports, renderATCTable } from './atc.js';
import { fetchAndUpdateFlights, startAutoUpdate, stopAutoUpdate } from './flights.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Apply default settings from cookies
    applyDefaults();

    try {
        // Initialize data fetching and rendering
        await fetchActiveATCAirports();
        await renderATCTable();
    } catch (error) {
        console.error('Error initializing ATC table:', error.message);
    }

    // DOM Elements
    const searchButton = document.getElementById("search");
    const icaoInput = document.getElementById("icao");
    const updateButton = document.getElementById("update");

    let isAutoUpdateActive = false;

    // Handle Search
    async function handleSearch() {
        const icao = icaoInput.value.trim().toUpperCase();

        if (!icao) {
            alert("Please enter a valid ICAO code.");
            return;
        }

        // Stop any ongoing updates
        stopAutoUpdate();

        // Clear previous flight data
        allFlights = [];
        interpolatedFlights = [];
        airportCoordinates = null; // Reset airport coordinates
        lastApiUpdateTime = null;

        // Clear table to reflect no flights before fetching new data
        const tableBody = document.querySelector("#flightsTable tbody");
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
        }

        try {
            // Fetch and update flights for the new ICAO
            await fetchAndUpdateFlights(icao);

            // Automatically start updates for the new ICAO
            startAutoUpdate(icao);
        } catch (error) {
            console.error("Error during search:", error.message);
            alert("Failed to fetch and update flights. Please try again.");
        }
    }

    // Add event listeners for search functionality
    if (searchButton) {
        searchButton.addEventListener("click", async () => {
            await handleSearch();
        });
    }

    if (icaoInput) {
        icaoInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await handleSearch();
            }
        });
    }

    // Start auto-update
    function startAutoUpdate(icao) {
        isAutoUpdateActive = true;
        updateButton.style.color = "blue";
        const icon = updateButton.querySelector("i");
        if (icon) icon.classList.add("spin");

        // Add intervals for auto-updating flights and ATC data
        // ... (similar to the previous auto-update logic)
    }

    // Stop auto-update
    function stopAutoUpdate() {
        isAutoUpdateActive = false;

        // Update the button style to reflect the stopped state
        updateButton.style.color = "#828282";
        const icon = updateButton.querySelector("i");
        if (icon) icon.classList.remove("spin");

        // Clear all intervals and reset related variables
        // ... (similar to the previous stop auto-update logic)
    }

    // Add event listener for the update button
    if (updateButton) {
        updateButton.addEventListener("click", () => {
            const icao = icaoInput.value.trim().toUpperCase();

            if (!icao) {
                alert("Please enter a valid ICAO code before updating.");
                return;
            }

            if (isAutoUpdateActive) {
                stopAutoUpdate();
            } else {
                startAutoUpdate(icao); 
            }
        });
    }
});