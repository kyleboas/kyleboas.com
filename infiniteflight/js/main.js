import { fetchATCData } from './atc.js';
import { fetchFlights } from './flights.js';
import { fetchAirportCoordinates } from './airport.js';
import { renderATCTable, renderFlightsTable } from './ui.js';

async function init() {
    await fetchATCData();
    renderFlightsTable();
}

document.addEventListener("DOMContentLoaded", init);