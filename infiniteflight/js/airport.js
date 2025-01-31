import { fetchAirportData } from "./api.js";
import { getCache, setCache, cacheExpiration } from "./cache.js";

// Fetch airport latitude and longitude
export async function fetchAirportCoordinates(icao) {
    const cached = getCache(icao, 'airportCoordinates', cacheExpiration.airportCoordinates);
    if (cached) {
        return cached;
    }
    
    try {
        const data = await fetchAirportData;
        const coordinates = { latitude: data.result.latitude, longitude: data.result.longitude };
        setCache(icao, coordinates, 'airportCoordinates');
        return coordinates;
    } catch (error) {
        console.error('Error fetching airport coordinates:', error.message);
        alert('Failed to fetch airport coordinates.');
        return null;
    }
}