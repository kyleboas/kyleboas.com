// Import dependencies
import { getICAO } from "./icao.js";
import { AIRPORTDB_URL } from "./api.js";

// Cache settings
const CACHE_EXPIRATION_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Fetches airport data, using cached data when possible.
 * Falls back to fetching fresh data if the cache is too old.
 */
export async function fetchAirportData() {
    const icao = getICAO();
    if (!icao) {
        console.error("No ICAO code found in session storage.");
        return null;
    }

    const CACHE_KEY = `airportData_${icao}`; // Unique cache key for each ICAO code

    try {
        // Check if cached data exists
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            const ageInDays = (Date.now() - timestamp) / MS_PER_DAY;

            // Use cached data if it's still valid
            if (ageInDays < CACHE_EXPIRATION_DAYS) {
                return data;
            } else {
                console.log(`[Cache] Cache expired for ICAO: ${icao}, fetching new data...`);
            }
        } else {
            console.log(`[Cache] No cached data found for ICAO: ${icao}, fetching new data...`);
        }
    } catch (error) {
        console.warn(`[Cache] Failed to parse cache for ICAO: ${icao}, fetching new data...`, error);
    }

    // Fetch new data if cache is expired or invalid
    try {
        console.log(`[Fetch] Requesting fresh data for ICAO: ${icao}`);
        const response = await fetch(`${AIRPORTDB_URL}${icao}`);
        
        if (!response.ok) {
            throw new Error(`Error fetching airport data: ${response.statusText}`);
        }

        const data = await response.json();

        // Store new data in localStorage with timestamp
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));

        console.log(`[Fetch] Successfully fetched and cached data for ICAO: ${icao}`);
        return data;
    } catch (error) {
        console.error(`[Fetch] Failed to fetch airport data for ICAO: ${icao}`, error);
        return null;
    }
}