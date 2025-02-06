import { setICAO } from "./icao.js";
import { fetchAirportData } from "./airport.js";

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
        
        const airportData = await fetchAirportData();
        if (!airportData) {
            console.error("Failed to fetch airport data.");
            return;
        }
        console.log("Airport data fetched successfully:", airportData);
    } else {
        setICAO(null); // Clear ICAO if invalid
    }
}

export { inputSearch };