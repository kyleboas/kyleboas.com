import { getICAO } from "./icao.js";
import { AIRPORTDB_URL } from "./api.js";

const CACHE_KEY = "airportData";
const CACHE_EXPIRATION_DAYS = 180; 
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function fetchAirportData() {
    const icao = getICAO();
    if (!icao) {
        console.error("No ICAO code found in session storage.");
        return null;
    }

    // Check if cached data exists
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        const ageInDays = (Date.now() - timestamp) / MS_PER_DAY;

        if (ageInDays < CACHE_EXPIRATION_DAYS) {
            console.log("Using cached airport data");
            return data; // Use cached data
        }
    }

    try {
        console.log("Fetching fresh airport data...");
        const response = await fetch(`${AIRPORTDB_URL}${icao}`);
        if (!response.ok) {
            throw new Error(`Error fetching airport data: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Store fetched data in localStorage with timestamp
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));

        return data;
    } catch (error) {
        console.error("Failed to fetch airport data:", error);
        return null;
    }
}