import { fetchStatusData } from './api.js';
import { SESSION_ID } from './config.js';

export async function fetchFlights(icao) {
    const flights = await fetchStatusData(${icao});
    state.allFlights = flights.result || [];
}

export function getFlights() {
    return state.allFlights.length > 0 ? state.allFlights : state.interpolatedFlights;
}