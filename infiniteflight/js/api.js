export const PROXY_URL = 'https://infiniteflightapi.deno.dev';
export const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8';

export async function fetchWithProxy(endpoint) {
    try {
        const response = await fetch(`${PROXY_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status}`);
        }

        const textResponse = await response.text();
        return JSON.parse(textResponse);
    } catch (error) {
        console.error("API Error:", error.message);
        throw error;
    }
}

// Airport Data
let airportDataCache = null;
let airportDataFetchPromise = null;

async function fetchAirportData(icao) {
    if (airportDataCache) return airportDataCache;
    if (airportDataFetchPromise) return airportDataFetchPromise;

    airportDataFetchPromise = fetchWithProxy(`/airport/${icao}`)
        .then((data) => {
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                throw new Error("Invalid Airport data format.");
            }
            airportDataCache = data.result;
            return airportDataCache;
        })
        .catch((error) => {
            console.error("Error fetching Airport data:", error.message);
            airportDataCache = null;
            airportDataFetchPromise = null;
            throw error;
        });

    return airportDataFetchPromise;
}

function clearAirportDataCache() {
    airportDataCache = null;
    airportDataFetchPromise = null;
}

// ATC Data
let atcDataCache = null;
let atcDataFetchPromise = null;

async function fetchATCData() {
    if (atcDataCache) return atcDataCache;
    if (atcDataFetchPromise) return atcDataFetchPromise;

    atcDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/atc`)
        .then((data) => {
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                throw new Error("Invalid ATC data format.");
            }
            atcDataCache = data.result;
            return atcDataCache;
        })
        .catch((error) => {
            console.error("Error fetching ATC data:", error.message);
            atcDataCache = null;
            atcDataFetchPromise = null;
            throw error;
        });

    return atcDataFetchPromise;
}

function clearATCDataCache() {
    atcDataCache = null;
    atcDataFetchPromise = null;
}

// ATIS Data
let atisDataCache = null;
let atisDataFetchPromise = null;

async function fetchATISData(icao) {
    if (atisDataCache) return atisDataCache;
    if (atisDataFetchPromise) return atisDataFetchPromise;

    atisDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/atis`)
        .then((data) => {
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                throw new Error("Invalid ATIS data format.");
            }
            atisDataCache = data.result;
            return atisDataCache;
        })
        .catch((error) => {
            console.error("Error fetching ATIS data:", error.message);
            atisDataCache = null;
            atisDataFetchPromise = null;
            throw error;
        });

    return atisDataFetchPromise;
}

function clearATISDataCache() {
    atisDataCache = null;
    atisDataFetchPromise = null;
}

// Flights Data
let flightsDataCache = null;
let flightsDataFetchPromise = null;

async function fetchFlightsData() {
    if (flightsDataCache) return flightsDataCache;
    if (flightsDataFetchPromise) return flightsDataFetchPromise;

    flightsDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/flights`)
        .then((data) => {
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                throw new Error("Invalid Flights data format.");
            }
            flightsDataCache = data.result;
            return flightsDataCache;
        })
        .catch((error) => {
            console.error("Error fetching Flights data:", error.message);
            flightsDataCache = null;
            flightsDataFetchPromise = null;
            throw error;
        });

    return flightsDataFetchPromise;
}

function clearFlightsDataCache() {
    flightsDataCache = null;
    flightsDataFetchPromise = null;
}

// Status Data
let statusDataCache = null;
let statusDataFetchPromise = null;

async function fetchStatusData(icao) {
    if (statusDataCache) return statusDataCache;
    if (statusDataFetchPromise) return statusDataFetchPromise;

    statusDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`)
        .then((data) => {
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                throw new Error("Invalid status data format.");
            }
            statusDataCache = data.result;
            return statusDataCache;
        })
        .catch((error) => {
            console.error("Error fetching status data:", error.message);
            statusDataCache = null;
            statusDataFetchPromise = null;
            throw error;
        });

    return statusDataFetchPromise;
}

function clearStatusDataCache() {
    statusDataCache = null;
    statusDataFetchPromise = null;
}

// World Data
let worldDataCache = null;
let worldDataFetchPromise = null;

async function fetchWorldData() {
    if (worldDataCache) return worldDataCache;
    if (worldDataFetchPromise) return worldDataFetchPromise;

    worldDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/world`)
        .then((data) => {
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                throw new Error("Invalid world data format.");
            }
            worldDataCache = data.result;
            return worldDataCache;
        })
        .catch((error) => {
            console.error("Error fetching world data:", error.message);
            worldDataCache = null;
            worldDataFetchPromise = null;
            throw error;
        });

    return worldDataFetchPromise;
}

function clearWorldDataCache() {
    worldDataCache = null;
    worldDataFetchPromise = null;
}

// Exporting Corrected Functions
export {
    fetchWorldData,
    clearWorldDataCache,
    fetchStatusData,
    clearStatusDataCache,
    fetchFlightsData,
    clearFlightsDataCache,
    fetchATISData,
    clearATISDataCache,
    fetchATCData,
    clearATCDataCache,
    fetchAirportData,
    clearAirportDataCache
};