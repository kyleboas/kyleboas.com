console.log("ui.js - Importing");  // Marks the start of execution in this file

import { fetchFlights } from './flights.js';
console.log("ui.js - Imported: fetchFlights from flights.js");

import { fetchATCData } from './atc.js';
console.log("ui.js - Imported: fetchATCData from atc.js");

import { fetchAirportCoordinates } from './airport.js';
console.log("ui.js - Imported: fetchAirportCoordinates from airport.js");

import { getFlights } from './flights.js';
console.log("ui.js - Imported: getFlights from flights.js");

import { state } from './config.js';
console.log("ui.js - Imported: state from config.js");

console.log("ui.js - Successfully imported.");

export function renderFlightsTable() {
    const tableBody = document.querySelector("#flightsTable tbody");
    tableBody.innerHTML = "";

    if (state.allFlights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No flights found.</td></tr>';
        return;
    }

    state.allFlights.forEach(flight => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${flight.callsign}</td>`;
        tableBody.appendChild(row);
    });
}

document.getElementById("search").addEventListener("click", async () => {
    const icao = document.getElementById("icao").value.trim().toUpperCase();
    if (!icao) return;
    await fetchFlights(icao);
    renderFlightsTable();
});