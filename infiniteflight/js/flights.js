import { SESSION_ID, allFlights, interpolatedFlights, airportCoordinates, lastApiUpdateTime } from './constants.js';
import { fetchWithProxy, setCache, getCache, cacheExpiration } from './utils.js';

export async function fetchInboundFlightIds(icao) {
    const cached = getCache(icao, 'inboundFlightIds', cacheExpiration.inboundFlightIds);
    if (cached) {
        return cached;
    }

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`);
        const inboundFlights = data.result.inboundFlights || [];
        setCache(icao, inboundFlights, 'inboundFlightIds');
        return inboundFlights;
    } catch (error) {
        console.error('Error fetching inbound flight IDs:', error.message);
        alert('Failed to fetch inbound flight IDs.');
        return [];
    }
}

export async function fetchInboundFlightDetails(inboundFlightIds = []) {
    try {
        // Fetch flights data from the proxy API
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/flights`);

        // Validate API response
        if (!data || !data.result || !Array.isArray(data.result)) {
            throw new Error("Invalid flight data received from the API.");
        }

        // Filter flights based on the inbound flight IDs
        let flightsFromApi = data.result.filter(flight => inboundFlightIds.includes(flight.flightId));

        // Ensure only unique flight details are returned
        const uniqueFlights = [...new Map(flightsFromApi.map(f => [f.flightId, f])).values()];

        // Map relevant details for each flight
        return uniqueFlights.map(flight => ({
            flightId: flight.flightId,
            callsign: flight.callsign || "N/A",
            aircraftId: flight.aircraftId || "N/A",
            aircraftName: aircraftMachDetails[flight.aircraftId]?.name || "UNKN", // Aircraft name lookup
            latitude: flight.latitude || null,
            longitude: flight.longitude || null,
            altitude: Math.round(flight.altitude) || "N/A",
            speed: Math.round(flight.speed) || "N/A",
            heading: Math.round(flight.heading) || "N/A",
            lastReport: flight.lastReport || "N/A",
            destinationIcao: flight.destinationIcao || "N/A",
            interpolatedPositions: [], // Placeholder for interpolated data
        }));
    } catch (error) {
        console.error("Error fetching flight details:", error.message);
        alert("Failed to fetch flight details.");
        stopAutoUpdate();
        return [];
    }
}