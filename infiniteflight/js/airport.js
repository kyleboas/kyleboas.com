import { fetchAirportData } from './api.js';
import { SESSION_ID } from './config.js';

export async function fetchAirportCoordinates(icao) {
    const cached = getCache(icao, 'airportCoordinates', cacheExpiration.airportCoordinates);
    if (cached) {
        return cached;
    }
    
    try {
        const data = await fetchAirportData(icao);

        // Validate response data
        if (!data || !data.result || typeof data.result.latitude !== 'number' || typeof data.result.longitude !== 'number') {
            throw new Error('Invalid API response');
        }

        const coordinates = { latitude: data.result.latitude, longitude: data.result.longitude };
        
        // Cache the coordinates
        setCache(icao, coordinates, 'airportCoordinates');
        
        return coordinates;
    } catch (error) {
        console.error('Error fetching airport coordinates:', error.message);
        alert('Failed to fetch airport coordinates.');
        return null;
    }
}