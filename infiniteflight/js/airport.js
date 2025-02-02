import { fetchAirportData } from './api.js';
import { SESSION_ID } from './config.js';

export async function fetchAirportCoordinates(icao) {
    return await fetchAirportData(icao);
}