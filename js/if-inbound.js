// ============================
// Constants and Global State
// ============================

const PROXY_URL = 'https://infiniteflightapi.deno.dev/';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8';

let allFlights = [];
let headingFilterActive = false;
let boldedHeadings = { minHeading: null, maxHeading: null };
let distanceFilterActive = false;
let minDistance = null;
let maxDistance = null;
let boldedHeadings = { minHeading: null, maxHeading: null };
let minDistance = null, maxDistance = null;
let updateInterval = null;
let updateTimeout = null;
let countdownInterval = null;
let hideOtherAircraft = false;
let boldHeadingEnabled = false;
let filterHighlightByHeading = false;

// Cache and expiration configuration
const cache = {
    airportCoordinates: {},
    inboundFlightIds: {},
    atis: {},
    controllers: {},
};
const cacheExpiration = {
    airportCoordinates: 90 * 24 * 60 * 60 * 1000, // 90 days
    inboundFlightIds: 5 * 60 * 1000, // 5 minutes
    atis: 30 * 60 * 1000, // 30 minutes
    controllers: 10 * 60 * 1000, // 10 minutes
};

// ============================
// Utility Functions
// ============================

function setCache(key, value, type) {
    cache[type][key] = { value, timestamp: Date.now() };
}

function getCache(key, type, expiration) {
    const entry = cache[type][key];
    if (!entry) return null;

    if (Date.now() - entry.timestamp > expiration) {
        delete cache[type][key];
        return null;
    }
    return entry.value;
}

function getUncachedIds(ids, type) {
    return ids.filter(id => !cache[type][id]);
}

function parseETAInSeconds(eta) {
    if (!eta || eta === 'N/A') return Infinity;
    if (eta === '>12hrs') return 720 * 60; // Represent ">12hrs" as the maximum value
    const [minutes, seconds] = eta.split(':').map(Number);
    return minutes * 60 + seconds;
}

// ============================
// API Fetch Functions
// ============================

async function fetchWithProxy(endpoint) {
    try {
        const sanitizedEndpoint = endpoint.replace(/\/{2,}/g, '/');
        const response = await fetch(`${PROXY_URL}${sanitizedEndpoint}`);
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error from proxy:', errorData);
            throw new Error(`Error fetching data: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error communicating with proxy:', error.message);
        throw error;
    }
}

async function fetchActiveATCAirports() {
    const endpoint = `/sessions/${SESSION_ID}/world`;

    try {
        const data = await fetchWithProxy(endpoint);

        const activeAtcAirports = (data.result || [])
            .filter(airport => airport.inboundFlightsCount > 0 || (airport.atcFacilities && airport.atcFacilities.length > 0))
            .map(airport => ({
                icao: airport.airportIcao,
                inboundCount: airport.inboundFlightsCount || 0,
            }))
            .sort((a, b) => b.inboundCount - a.inboundCount);

        const uniqueAirports = Array.from(new Map(activeAtcAirports.map(airport => [airport.icao, airport])).values());
        const topAirports = uniqueAirports.slice(0, 5);

        const listContent = topAirports.map(
            airport => `${airport.icao}: ${airport.inboundCount}`
        ).join('\n');

        document.getElementById('atcAirportsList').textContent = listContent || 'No active ATC airports found.';
    } catch (error) {
        console.error('Error fetching active ATC airports:', error.message);
        document.getElementById('atcAirportsList').textContent = 'Failed to fetch active ATC airports.';
    }
}

async function fetchAndUpdateFlights(icao) {
    try {
        console.log(`Fetching flights for ICAO: ${icao}`);
        
        // Validate ICAO input
        if (!icao || icao.length !== 4) {
            throw new Error("Invalid ICAO code. Please ensure it's 4 characters long.");
        }

        const inboundFlightIds = await fetchInboundFlightIds(icao);
        console.log(`Inbound flight IDs:`, inboundFlightIds);

        if (!inboundFlightIds.length) {
            throw new Error("No inbound flight IDs found for this ICAO.");
        }

        const flights = await fetchInboundFlightDetails(inboundFlightIds);
        console.log(`Fetched flight details:`, flights);

        if (!flights.length) {
            throw new Error("No flights found for the provided ICAO.");
        }

        const airportCoordinates = await fetchAirportCoordinates(icao);
        console.log(`Fetched airport coordinates:`, airportCoordinates);

        if (!airportCoordinates) {
            throw new Error("Failed to fetch airport coordinates.");
        }

        // Update distances and ETAs
        await updateDistancesAndETAs(flights, airportCoordinates);
        allFlights = flights;

        // Render the flight table
        renderFlightsTable(allFlights);
        console.log("Rendered flight table successfully.");

        // Fetch and display ATIS and controllers
        await fetchAirportATIS(icao);
        await fetchControllers(icao);
        console.log("Fetched ATIS and controllers successfully.");
    } catch (error) {
        console.error("Error in fetchAndUpdateFlights:", error.message);
        alert(`Failed to fetch data. ${error.message}`);
    }
}

async function fetchInboundFlightIds(icao) {
    const cached = getCache(icao, 'inboundFlightIds', cacheExpiration.inboundFlightIds);
    if (cached) return cached;

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`);
        const inboundFlights = data.result.inboundFlights || [];
        setCache(icao, inboundFlights, 'inboundFlightIds');
        return inboundFlights;
    } catch (error) {
        console.error('Error fetching inbound flight IDs:', error.message);
        return [];
    }
}

async function fetchInboundFlightDetails(inboundFlightIds) {
    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/flights`);
        return data.result.filter(flight => inboundFlightIds.includes(flight.flightId));
    } catch (error) {
        console.error('Error fetching flight details:', error.message);
        return [];
    }
}

async function fetchAirportCoordinates(icao) {
    const cached = getCache(icao, 'airportCoordinates', cacheExpiration.airportCoordinates);
    if (cached) return cached;

    try {
        const data = await fetchWithProxy(`/airport/${icao}`);
        const coordinates = { latitude: data.result.latitude, longitude: data.result.longitude };
        setCache(icao, coordinates, 'airportCoordinates');
        return coordinates;
    } catch (error) {
        console.error('Error fetching airport coordinates:', error.message);
        return null;
    }
}

async function fetchAirportATIS(icao) {
    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) return cached;

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/atis`);
        setCache(icao, data.result, 'atis');
        displayATIS(data.result);
        return data.result;
    } catch (error) {
        console.error('Error fetching ATIS:', error.message);
        return null;
    }
}

async function fetchControllers(icao) {
    const cached = getCache(icao, 'controllers', cacheExpiration.controllers);
    if (cached) return cached;

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`);
        const controllers = (data.result.atcFacilities || [])
            .map(facility => `${facility.type}: ${facility.username}`);
        setCache(icao, controllers, 'controllers');
        displayControllers(controllers);
        return controllers;
    } catch (error) {
        console.error('Error fetching controllers:', error.message);
        return [];
    }
}

// ============================
// Table and UI Updates
// ============================

function renderFlightsTable(flights) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    if (!flights.length) {
        tableBody.innerHTML = '<tr><td colspan="5">No inbound flights found.</td></tr>';
        return;
    }

    flights.forEach(flight => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${flight.callsign || 'N/A'}</td>
            <td>${flight.speed?.toFixed(0) || 'N/A'}</td>
            <td>${flight.altitude?.toFixed(0) || 'N/A'}</td>
            <td>${Math.round(flight.headingFromAirport) || 'N/A'}</td>
            <td>${flight.etaMinutes || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function displayATIS(atis) {
    const atisElement = document.getElementById('atisMessage');
    atisElement.textContent = atis || 'ATIS not available';
}

function displayControllers(controllers) {
    const controllersElement = document.getElementById('controllersList');
    controllersElement.textContent = controllers.length
        ? controllers.join('\n')
        : 'No active controllers available';
}

// ============================
// Event Listeners
// ============================

document.addEventListener('DOMContentLoaded', async () => {
    await fetchActiveATCAirports();

    document.getElementById('searchForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const icao = document.getElementById('icao').value.trim().toUpperCase();

        if (!icao) {
            alert('Please enter a valid ICAO code.');
            return;
        }

        console.log(`Search submitted for ICAO: ${icao}`);
        await fetchAndUpdateFlights(icao);
    });

    document.getElementById('boldHeadingButton').addEventListener('click', () => {
        boldHeadingEnabled = !boldHeadingEnabled;
        document.getElementById('boldHeadingButton').textContent = boldHeadingEnabled
            ? 'Disable Bold Aircraft'
            : 'Enable Bold Aircraft';
        renderFlightsTable(allFlights);
    });

    document.getElementById('applyDistanceFilterButton').addEventListener('click', () => {
        minDistance = parseFloat(document.getElementById('minDistance').value) || null;
        maxDistance = parseFloat(document.getElementById('maxDistance').value) || null;
        renderFlightsTable(allFlights);
    });

    document.getElementById('resetDistanceFilterButton').addEventListener('click', () => {
        minDistance = maxDistance = null;
        document.getElementById('minDistance').value = '';
        document.getElementById('maxDistance').value = '';
        renderFlightsTable(allFlights);
    });

    document.getElementById('filterHeadingHighlightButton').addEventListener('click', () => {
        filterHighlightByHeading = !filterHighlightByHeading;
        document.getElementById('filterHeadingHighlightButton').textContent = filterHighlightByHeading
            ? 'Disable Highlight Filter by Heading'
            : 'Enable Highlight Filter by Heading';
        renderFlightsTable(allFlights);
    });
});