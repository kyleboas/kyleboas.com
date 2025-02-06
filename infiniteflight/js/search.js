import { setICAO } from "./icao.js";
import { fetchAirportData } from "./airport.js";

async function inputSearch() {
    console.log("Search triggered!");
    const inputElement = document.getElementById("icao");
    if (!inputElement) {
        console.error("ICAO input field not found.");
        return;
    }
    const inputICAO = inputElement.value.trim().toUpperCase();
    
    console.log("User entered ICAO:", inputICAO);

    if (inputICAO.length === 4) {
        setICAO(inputICAO);
        console.log(`ICAO stored: ${getICAO()}`);

        const airportData = await fetchAirportData();
        console.log("Fetched airport data:", airportData);
    } else {
        setICAO(null);
    }
}

export { inputSearch };