import { setICAO } from "./icao.js";
import { fetchAirportData } from "./airport.js";
import { updateRunwaySpacingDisplay } from "./spacing.js";

// Function to handle search and update UI
async function inputSearch() {
    const inputElement = document.getElementById("icao");
    if (!inputElement) {
        console.error("ICAO input field not found.");
        return;
    }

    const inputICAO = inputElement.value.trim().toUpperCase();
    if (inputICAO.length !== 4) {
        console.warn("Invalid ICAO code. Must be exactly 4 characters.");
        return;
    }

    setICAO(inputICAO);
    console.log(`ICAO stored: ${inputICAO}`);

    const airportData = await fetchAirportData();
    if (!airportData) return;

    updateRunwaySpacingDisplay();
}

export { inputSearch };