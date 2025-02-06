import { setICAO } from "./icao.js";
import { fetchAirportData } from "./airport.js";
import { updateRunwaySpacingDisplay } from "./spacing.js";

async function inputSearch() {
    const inputElement = document.getElementById("icao");
    if (!inputElement) {
        console.error("ICAO input field not found.");
        return;
    }

    const inputICAO = inputElement.value.trim().toUpperCase();
    
    if (inputICAO.length === 4) {
        setICAO(inputICAO);
        console.log(`ICAO stored: ${inputICAO}`);
    }

    const airportData = await fetchAirportData();
    if (!airportData) {
        console.error("Failed to fetch airport data.");
        return;
    }

    console.log("Updating runway spacing display...");
    await updateRunwaySpacingDisplay();
}

export { inputSearch };