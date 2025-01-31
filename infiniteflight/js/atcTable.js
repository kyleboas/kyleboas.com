import { fetchATCData } from "./api.js";
import { fetchInboundFlightIds, fetchInboundFlightDetails, updateDistancesAndETAs } from "./flights.js";
import { fetchAirportCoordinates } from "./airport.js";
import { fetchActiveATCAirports } from "./ATC.js";

// Map frequency type to short codes
function mapFrequencyType(type) {
    const frequencyMap = {
        0: "G", // Ground
        1: "T", // Tower
        2: "U", // Unicom
        3: "C", // Clearance
        4: "A", // Approach
        5: "D", // Departure
        6: "C", // Center
        7: "S", // ATIS
    };
    return frequencyMap[type] || null;
}

// Fetch and process active ATC data
export async function fetchActiveATCAirportsData() {
    try {
        const atcData = await fetchATCData();
        if (!Array.isArray(atcData)) {
            throw new Error("Invalid ATC data format.");
        }

        const frequencyOrder = ["G", "T", "A", "D", "S"];

        const airports = atcData.reduce((acc, facility) => {
            const icao = facility.airportName;
            const frequencyCode = mapFrequencyType(facility.type);

            if (!icao) return acc;
            if (!acc[icao]) acc[icao] = { icao, frequencies: [] };
            if (frequencyCode) acc[icao].frequencies.push(frequencyCode);

            return acc;
        }, {});

        return Object.values(airports).map(airport => ({
            ...airport,
            frequencies: frequencyOrder.filter(freq => airport.frequencies.includes(freq)).join(""),
        }));
    } catch (error) {
        console.error("Error in fetchActiveATCAirportsData:", error.message);
        return [];
    }
}

// Count inbound flights by distance range
export function countInboundFlightsByDistance(flights) {
    if (!Array.isArray(flights)) return { "50nm": 0, "200nm": 0, "500nm": 0 };

    return flights.reduce((counts, flight) => {
        const distance = flight.distanceToDestination;
        if (typeof distance !== "number") return counts;

        if (distance <= 50) counts["50nm"]++;
        else if (distance <= 200) counts["200nm"]++;
        else if (distance <= 500) counts["500nm"]++;

        return counts;
    }, { "50nm": 0, "200nm": 0, "500nm": 0 });
}

// Render ATC Table
export async function renderATCTable() {
    const atcTableBody = document.querySelector("#atcTable tbody");
    if (!atcTableBody) {
        console.error("ATC table body not found in DOM.");
        return;
    }

    try {
        const activeATCAirports = await fetchActiveATCAirportsData();
        if (!activeATCAirports.length) {
            atcTableBody.innerHTML = '<tr><td colspan="6">No active ATC airports available.</td></tr>';
            return;
        }

        const airportData = [];

        for (const airport of activeATCAirports) {
            const inboundFlightIds = await fetchInboundFlightIds(airport.icao);
            const airportFlights = await fetchInboundFlightDetails(inboundFlightIds);
            const airportCoordinates = await fetchAirportCoordinates(airport.icao);

            if (!airportCoordinates) continue;

            await updateDistancesAndETAs(airportFlights, airportCoordinates);
            const distanceCounts = countInboundFlightsByDistance(airportFlights);

            airportData.push({
                icao: airport.icao,
                frequencies: airport.frequencies || "N/A",
                distanceCounts,
                totalInbounds: airportFlights.length,
            });
        }

        airportData.sort((a, b) => b.totalInbounds - a.totalInbounds);

        atcTableBody.innerHTML = airportData.map(airport => `
            <tr data-icao="${airport.icao}">
                <td>${airport.icao}</td>
                <td>${airport.frequencies}</td>
                <td>${airport.distanceCounts["50nm"] || 0}</td>
                <td>${airport.distanceCounts["200nm"] || 0}</td>
                <td>${airport.distanceCounts["500nm"] || 0}</td>
                <td>${airport.totalInbounds || 0}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Error in renderATCTable:", error.message);
        atcTableBody.innerHTML = '<tr><td colspan="6">Error loading ATC data. Check console for details.</td></tr>';
    }
}