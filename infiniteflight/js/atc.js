import { SESSION_ID } from './constants.js';
import { setCache, getCache, cacheExpiration } from './utils.js';
import { fetchWithProxy } from './fetch.js';

export let atcDataCache = null;
export let atcDataFetchPromise = null;

export async function fetchATCData() {
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

export function clearATCDataCache() {
    atcDataCache = null;
    atcDataFetchPromise = null;
}