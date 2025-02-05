import { getICAO } from "./icao.js";
import { AIRPORTDB_URL } "./api.js";

export async function fetchAirportData() {
    const icao = getICAO();
    if (!icao) {
        console.error("No ICAO code found in session storage.");
        return null;
    }

    try {
        const response = await fetch(`${AIRPORTDB_URL}${icao}`);
        if (!response.ok) {
            throw new Error(`Error fetching airport data: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch airport data:", error);
        return null;
    }
}

export { fetchAirportData };