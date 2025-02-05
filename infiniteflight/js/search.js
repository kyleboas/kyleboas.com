import { setICAO } from "./icao.js";

async function handleSearch() {
    const inputICAO = icaoInput.value.trim().toUpperCase();

    if (!inputICAO) {
        alert("Please enter a valid ICAO code.");
        return;
    }
    
    setICAO(inputICAO);

    stopAutoUpdate();
    allFlights = [];
    interpolatedFlights = [];
    airportCoordinates = null;
    lastApiUpdateTime = null;

    const tableBody = document.querySelector("#flightsTable tbody");
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    }

    try {
        airportCoordinates = await fetchAirportCoordinates(inputICAO);
        if (!airportCoordinates) {
            throw new Error("Failed to fetch airport coordinates.");
        }
        
        await fetchAndUpdateFlights(inputICAO);
        updateAircraftOnMap(allFlights, airportCoordinates);
        startAutoUpdate(inputICAO);
    } catch (error) {
        console.error("Error during search:", error.message);
        alert("Failed to fetch and update flights. Please try again.");
    }
}

export { handleSearch };