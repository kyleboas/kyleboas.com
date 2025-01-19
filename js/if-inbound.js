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
let updateInterval = null;
let updateTimeout = null;
let countdownInterval = null;
let hideOtherAircraft = false;

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
        delete cache[type][key]; // Remove expired entry
        return null;
    }
    return entry.value;
}

function getUncachedIds(ids, type) {
    return ids.filter(id => !cache[type][id]);
}

// ============================
// Fetch Functions
// ============================

async function fetchWithProxy(endpoint) {
    try {
        const response = await fetch(`${PROXY_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error from proxy:', errorData);
            throw new Error(`Error fetching data: ${response.status}`);
        }

        const textResponse = await response.text();
        return JSON.parse(textResponse); // Attempt to parse as JSON
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
        alert('Failed to fetch airport coordinates.');
        return null;
    }
}

async function fetchAirportATIS(icao) {
    const atisElement = document.getElementById('atisMessage');
    atisElement.textContent = 'Fetching ATIS...';

    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) {
        displayATIS(cached);
        return cached;
    }

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/atis`);
        const atis = data.result || 'ATIS not available';
        setCache(icao, atis, 'atis');
        displayATIS(atis);
        return atis;
    } catch (error) {
        console.error('Error fetching ATIS:', error.message);
        displayATIS('ATIS not available');
        return 'ATIS not available';
    }
}

async function fetchControllers(icao) {
    const cached = getCache(icao, 'controllers', cacheExpiration.controllers);
    if (cached) {
        displayControllers(cached);
        return cached;
    }

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`);
        const controllers = (data.result.atcFacilities || [])
            .map(facility => ({
                frequencyName: {
                    0: "Ground",
                    1: "Tower",
                    2: "Unicom",
                    3: "Clearance",
                    4: "Approach",
                    5: "Departure",
                    6: "Center",
                    7: "ATIS",
                    8: "Aircraft",
                    9: "Recorded",
                    10: "Unknown",
                    11: "Unused",
                }[facility.type] || "Unknown",
                username: facility.username,
            }))
            .sort((a, b) => {
                const order = ["ATIS", "Clearance", "Ground", "Tower", "Approach", "Departure", "Center", "Unknown"];
                return order.indexOf(a.frequencyName) - order.indexOf(b.frequencyName);
            })
            .map(ctrl => `${ctrl.frequencyName}: ${ctrl.username}`);

        setCache(icao, controllers, 'controllers');
        displayControllers(controllers);
        return controllers;
    } catch (error) {
        console.error('Error fetching controllers:', error.message);
        displayControllers(['No active controllers available']);
        return [];
    }
}

// ============================
// Display Functions
// ============================

function displayATIS(atis) {
    const atisElement = document.getElementById('atisMessage');
    if (!atisElement) {
        console.error('ATIS display element not found.');
        return;
    }
    atisElement.textContent = `ATIS: ${atis}`;
}

function displayControllers(controllers) {
    const controllersElement = document.getElementById('controllersList');
    if (!controllersElement) {
        console.error('Controller display element not found.');
        return;
    }
    controllersElement.textContent = controllers.length
        ? controllers.join('\n')
        : 'No active controllers available';
}

// ============================
// Event Listeners
// ============================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchActiveATCAirports();

        document.getElementById('boldHeadingButton').addEventListener('click', () => {
            boldHeadingEnabled = !boldHeadingEnabled;
            document.getElementById('boldHeadingButton').textContent = boldHeadingEnabled
                ? 'Disable Bold Aircraft'
                : 'Enable Bold Aircraft';
            renderFlightsTable(allFlights); // Update table
        });

        document.getElementById('applyDistanceFilterButton').addEventListener('click', () => {
            minDistance = parseFloat(document.getElementById('minDistance').value) || null;
            maxDistance = parseFloat(document.getElementById('maxDistance').value) || null;
            renderFlightsTable(allFlights); // Apply distance filter
        });

        document.getElementById('resetDistanceFilterButton').addEventListener('click', () => {
            minDistance = maxDistance = null;
            document.getElementById('minDistance').value = '';
            document.getElementById('maxDistance').value = '';
            renderFlightsTable(allFlights); // Reset filters
        });

        document.getElementById('filterHeadingHighlightButton').addEventListener('click', () => {
            filterHighlightByHeading = !filterHighlightByHeading;
            document.getElementById('filterHeadingHighlightButton').textContent = filterHighlightByHeading
                ? 'Disable Highlight Filter by Heading'
                : 'Enable Highlight Filter by Heading';
            renderFlightsTable(allFlights); // Toggle highlight filter
        });

        document.getElementById('searchForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const icao = document.getElementById('icao').value.trim().toUpperCase();
            if (icao) await fetchAndUpdateFlights(icao);
        });
    } catch (error) {
        console.error('Initialization error:', error.message);
    }
});