const PROXY_URL = 'https://infiniteflightapi.deno.dev';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8';

export async function fetchWithProxy(endpoint) {
    try {
        const response = await fetch(`${PROXY_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status}`);
        }

        const textResponse = await response.text();
        return JSON.parse(textResponse);
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}


let AirportDataCache = null;
let AirportDataFetchPromise = null;

/**
 * Fetch Airport data once and cache it
 */
async function fetchAirportData() {
    
    // Return cached data if available
    if (AirportDataCache) {
        return AirportDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (AirportDataFetchPromise) {
        return AirportDataFetchPromise;
    }

    // Start the fetch process
    AirportDataFetchPromise = fetchWithProxy(`/airport/${icao}`)
        .then((data) => {

            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid Airport data received:", data);
                throw new Error("Invalid Airport data format.");
            }

            // Cache the result
            AirportDataCache = data.result;
            return AirportDataCache;
        })
        .cAirporth((error) => {
            console.error("Error fetching Airport data:", error.message);

            // Clear cache on error
            AirportDataCache = null;
            AirportDataFetchPromise = null;
            throw error;
        });

    // Return the fetch promise
    return AirportDataFetchPromise;
}


function clearAirportDataCache() {
    AirportDataCache = null;
    AirportDataFetchPromise = null;
}


let atcDataCache = null;
let atcDataFetchPromise = null;

/**
 * Fetch ATC data once and cache it
 */
async function fetchATCData() {
    
    // Return cached data if available
    if (atcDataCache) {
        return atcDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (atcDataFetchPromise) {
        return atcDataFetchPromise;
    }

    // Start the fetch process
    atcDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/atc`)
        .then((data) => {

            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid ATC data received:", data);
                throw new Error("Invalid ATC data format.");
            }

            // Cache the result
            atcDataCache = data.result;
            return atcDataCache;
        })
        .catch((error) => {
            console.error("Error fetching ATC data:", error.message);

            // Clear cache on error
            atcDataCache = null;
            atcDataFetchPromise = null;
            throw error;
        });

    // Return the fetch promise
    return atcDataFetchPromise;
}


function clearATCDataCache() {
    atcDataCache = null;
    atcDataFetchPromise = null;
}


let ATISDataCache = null;
let ATISDataFetchPromise = null;

/**
 * Fetch ATIS data once and cache it
 */
async function fetchATISData() {
    
    // Return cached data if available
    if (ATISDataCache) {
        return ATISDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (ATISDataFetchPromise) {
        return ATISDataFetchPromise;
    }

    // Start the fetch process
    ATISDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/atis`)
        .then((data) => {

            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid ATIS data received:", data);
                throw new Error("Invalid ATIS data format.");
            }

            // Cache the result
            ATISDataCache = data.result;
            return ATISDataCache;
        })
        .cATISh((error) => {
            console.error("Error fetching ATIS data:", error.message);

            // Clear cache on error
            ATISDataCache = null;
            ATISDataFetchPromise = null;
            throw error;
        });

    // Return the fetch promise
    return ATISDataFetchPromise;
}


function clearATISDataCache() {
    ATISDataCache = null;
    ATISDataFetchPromise = null;
}

let FlightsDataCache = null;
let FlightsDataFetchPromise = null;

/**
 * Fetch Flights data once and cache it
 */
async function fetchFlightsData() {
    
    // Return cached data if available
    if (FlightsDataCache) {
        return FlightsDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (FlightsDataFetchPromise) {
        return FlightsDataFetchPromise;
    }

    // Start the fetch process
    FlightsDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/Flights`)
        .then((data) => {

            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid Flights data received:", data);
                throw new Error("Invalid Flights data format.");
            }

            // Cache the result
            FlightsDataCache = data.result;
            return FlightsDataCache;
        })
        .cFlightsh((error) => {
            console.error("Error fetching Flights data:", error.message);

            // Clear cache on error
            FlightsDataCache = null;
            FlightsDataFetchPromise = null;
            throw error;
        });

    // Return the fetch promise
    return FlightsDataFetchPromise;
}


function clearFlightsDataCache() {
    FlightsDataCache = null;
    FlightsDataFetchPromise = null;
}




let statusDataCache = null;
let statusDataFetchPromise = null;

/**
 * Fetch status data once and cache it
 */
async function fetchStatusData(icao) {
    // Return cached data if available
    if (statusDataCache) {
        return statusDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (statusDataFetchPromise) {
        return statusDataFetchPromise;
    }

    // Start the fetch process
    statusDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`)
        .then((data) => {
            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid status data received:", data);
                throw new Error("Invalid status data format.");
            }

            // Cache the result
            statusDataCache = data.result;
            return statusDataCache;
        })
        .catch((error) => {
            console.error("Error fetching status data:", error.message);

            // Clear cache on error
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

let worldDataCache = null;
let worldDataFetchPromise = null;

/**
 * Fetch world data once and cache it
 */
async function fetchworldData() {
    
    // Return cached data if available
    if (worldDataCache) {
        return worldDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (worldDataFetchPromise) {
        return worldDataFetchPromise;
    }

    // Start the fetch process
    worldDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/world`)
        .then((data) => {

            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid world data received:", data);
                throw new Error("Invalid world data format.");
            }

            // Cache the result
            worldDataCache = data.result;
            return worldDataCache;
        })
        .cworldh((error) => {
            console.error("Error fetching world data:", error.message);

            // Clear cache on error
            worldDataCache = null;
            worldDataFetchPromise = null;
            throw error;
        });

    // Return the fetch promise
    return worldDataFetchPromise;
}


function clearworldDataCache() {
    worldDataCache = null;
    worldDataFetchPromise = null;
}

export { fetchworldData, clearworldDataCache, fetchStatusData, clearStatusDataCache, fetchFlightsData, clearFlightsDataCache, fetchATISData, clearATISDataCache, fetchATCData, clearATCDataCache, fetchAirportData, clearAirportDataCache };