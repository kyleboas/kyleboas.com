import { getICAO } from "./icao.js";
import { AIRPORTDB_URL } from "./api.js";

const CACHE_KEY = "airportData";
const CACHE_EXPIRATION_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

let fetchPromise = null;

export function fetchAirportData() {
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
        const icao = getICAO();
        console.log("Fetching airport data for ICAO:", icao);  // Moved inside the function

        if (!icao) {
            if (!sessionStorage.getItem("icaoNotFoundLogged")) {
                console.error("No ICAO code found in session storage.");
                sessionStorage.setItem("icaoNotFoundLogged", "true");
            }
            fetchPromise = null;
            return null;
        }

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
            console.log("Fetching from URL:", `${AIRPORTDB_URL}${icao}`);
            const response = await fetch(`${AIRPORTDB_URL}${icao}`);
            if (!response.ok) {
                throw new Error(`Error fetching airport data: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Airport data received:", data);

            localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));

            return data;
        } catch (error) {
            console.error("Failed to fetch airport data:", error);
            fetchPromise = null;
            return null;
        }
    })();

    return fetchPromise;
}