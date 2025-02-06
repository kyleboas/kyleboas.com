import { getICAO } from "./icao.js";
import { AIRPORTDB_URL } from "./api.js";

const CACHE_KEY = "airportData";
const CACHE_EXPIRATION_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

let fetchPromise = null; // Singleton pattern to ensure only one fetch call

export function fetchAirportData() {
    if (fetchPromise) return fetchPromise; // Return existing promise if already running

    fetchPromise = (async () => {
        const icao = getICAO();
        if (!icao) {
            if (!sessionStorage.getItem("icaoNotFoundLogged")) {
                console.error("No ICAO code found in session storage.");
                sessionStorage.setItem("icaoNotFoundLogged", "true");
            }
            fetchPromise = null; // Reset so it can retry later
            return null;
        }

        // Check if cached data exists
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { timestamp, data } = JSON.parse(cached);
            const ageInDays = (Date.now() - timestamp) / MS_PER_DAY;

            if (ageInDays < CACHE_EXPIRATION_DAYS) {
                console.log("Using cached airport data");
                return data;
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
            fetchPromise = null; // Reset in case of failure
            return null;
        }
    })();

    return fetchPromise;
}