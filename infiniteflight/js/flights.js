import { fetchWithProxy } from './api.js';
import { SESSION_ID, state } from './config.js';

export async function fetchFlights(icao) {
    const flights = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`);
    state.allFlights = flights.result || [];
}

export function getFlights() {
    return state.allFlights.length > 0 ? state.allFlights : state.interpolatedFlights;
}