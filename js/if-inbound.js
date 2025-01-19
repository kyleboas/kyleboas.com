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
// Cache Management Functions
// ============================

function setCache(key, value, type) {
    cache[type][key] = { value, timestamp: Date.now() };
}

function getCache(key, type, expiration) {
    const entry = cache[type][key];
    if (!entry) return null;

    // Check expiration
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
        try {
            return JSON.parse(textResponse);
        } catch {
            throw new Error('Invalid JSON response');
        }
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
                inboundCount: airport.inboundFlightsCount || 0
            }))
            .sort((a, b) => b.inboundCount - a.inboundCount);

        const uniqueAirports = Array.from(new Map(activeAtcAirports.map(airport => [airport.icao, airport])).values());
        const topAirports = uniqueAirports.slice(0, 5);

        const listContent = topAirports.map(
            airport => `${airport.icao}: ${airport.inboundCount}`
        ).join('\n');

        const atcAirportsListElement = document.getElementById('atcAirportsList');
        atcAirportsListElement.textContent = listContent || 'No active ATC airports found.';
    } catch (error) {
        console.error('Error fetching active ATC airports:', error.message);

        const atcAirportsListElement = document.getElementById('atcAirportsList');
        atcAirportsListElement.textContent = 'Failed to fetch active ATC airports.';
    }
}

async function fetchAirportCoordinates(icao) {
    const cached = getCache(icao, 'airportCoordinates', cacheExpiration.airportCoordinates);
    if (cached) {
        console.log('Using cached coordinates for', icao);
        return cached;
    }

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
    if (atisElement) atisElement.textContent = 'Fetching ATIS...';

    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) {
        console.log('Using cached ATIS for', icao);
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
        console.log('Using cached controllers for', icao);
        displayControllers(cached);
        return cached;
    }

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`);
        const controllers = (data.result.atcFacilities || [])
            .map(facility => {
                const frequencyTypes = {
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
                };
                const frequencyName = frequencyTypes[facility.type] || "Unknown";
                return { frequencyName, username: facility.username, type: facility.type };
            });

        const sortedControllers = controllers.sort((a, b) => {
            const order = ["ATIS", "Clearance", "Ground", "Tower", "Approach", "Departure", "Center", "Unknown"];
            const indexA = order.indexOf(a.frequencyName);
            const indexB = order.indexOf(b.frequencyName);
            return indexA - indexB;
        }).map(ctrl => `${ctrl.frequencyName}: ${ctrl.username}`);

        setCache(icao, sortedControllers, 'controllers');
        displayControllers(sortedControllers);
        return sortedControllers;
    } catch (error) {
        console.error('Error fetching controllers:', error.message);
        displayControllers(['No active controllers available']);
        return [];
    }
}

async function fetchInboundFlightIds(icao) {
    const cached = getCache(icao, 'inboundFlightIds', cacheExpiration.inboundFlightIds);
    if (cached) {
        console.log('Using cached inbound flight IDs for', icao);
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

async function fetchInboundFlightDetails(inboundFlightIds) {
    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/flights`);
        const flightsFromApi = data.result.filter(flight => inboundFlightIds.includes(flight.flightId));

        const uniqueFlights = [...new Map(flightsFromApi.map(flight => [flight.flightId, flight])).values()];

        return uniqueFlights;
    } catch (error) {
        console.error('Error fetching flight details:', error.message);
        alert('Failed to fetch flight details.');
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
    console.log('Displaying ATIS:', atis);
    atisElement.textContent = `ATIS: ${atis}`;
}

function displayControllers(controllers) {
    const controllersElement = document.getElementById('controllersList');
    if (!controllersElement) {
        console.error('Controller display element not found.');
        return;
    }
    controllersElement.textContent = controllers.length
        ? `${controllers.join('\n')}`
        : 'No active controllers available';
}

// ============================
// Main Page Load Initialization
// ============================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchActiveATCAirports();

        // Set default values for heading and distance
        document.getElementById('minHeading').value = 90;
        document.getElementById('maxHeading').value = 270;
        boldedHeadings.minHeading = 90;
        boldedHeadings.maxHeading = 270;

        document.getElementById('minDistance').value = 50;
        document.getElementById('maxDistance').value = 500;
        minDistance = 50;
        maxDistance = 500;

        renderFlightsTable(allFlights, hideOtherAircraft);
    } catch (error) {
        console.error('Error initializing page:', error.message);
    }
});

// ============================
// Event Listeners
// ============================

document.getElementById('boldHeadingButton').addEventListener('click', () => {
    boldHeadingEnabled = !boldHeadingEnabled;

    document.getElementById('boldHeadingButton').textContent = boldHeadingEnabled
        ? 'Disable Bold Aircraft'
        : 'Enable Bold Aircraft';

    renderFlightsTable(allFlights);
});

document.getElementById('applyDistanceFilterButton').addEventListener('click', () => {
    applyDistanceFilterEnabled = !applyDistanceFilterEnabled;

    document.getElementById('applyDistanceFilterButton').textContent = applyDistanceFilterEnabled
        ? 'Reset Distance Filter'
        : 'Apply Distance Filter';

    renderFlightsTable(allFlights, hideOtherAircraft);
});

document.getElementById('filterHeadingHighlightButton').addEventListener('click', () => {
    filterHighlightByHeading = !filterHighlightByHeading;

    document.getElementById('filterHeadingHighlightButton').textContent = filterHighlightByHeading
        ? 'Disable Highlight Filter by Heading'
        : 'Enable Highlight Filter by Heading';

    renderFlightsTable(allFlights);
});

document.getElementById('resetDistanceFilterButton').addEventListener('click', () => {
    minDistance = null;
    maxDistance = null;

    document.getElementById('minDistance').value = '';
    document.getElementById('maxDistance').value = '';

    renderFlightsTable(allFlights, hideOtherAircraft);
});

document.getElementById('manualUpdateButton').addEventListener('click', async () => {
    const icao = document.getElementById('icao').value.trim().toUpperCase();
    if (!icao) {
        alert('Please enter a valid ICAO code.');
        return;
    }

    try {
        await fetchAirportATIS(icao);
        await fetchControllers(icao);
        alert('ATIS and Controllers updated successfully!');
    } catch (error) {
        console.error('Error during manual update:', error.message);
        alert('Failed to update ATIS and Controllers. Check console for details.');
    }
});

document.getElementById('toggleHeadingButton').addEventListener('click', () => {
    hideOtherAircraft = !hideOtherAircraft;

    document.getElementById('toggleHeadingButton').textContent = hideOtherAircraft
        ? 'Show All Aircraft'
        : 'Hide Other Aircraft';

    renderFlightsTable(allFlights, hideOtherAircraft);
});

document.getElementById('updateButton').addEventListener('click', () => {
    const icao = document.getElementById('icao').value.trim().toUpperCase();
    if (!icao) {
        alert('Please enter a valid ICAO code before updating.');
        return;
    }

    stopAutoUpdate();
    let countdown = 15; // Update countdown for 15 seconds
    const countdownTimer = document.getElementById('countdownTimer');

    updateInterval = setInterval(async () => {
        await fetchAndUpdateFlights(icao);
        await fetchControllers(icao);
        countdown = 15;
    }, 15000);

    countdownInterval = setInterval(() => {
        countdown--;
        countdownTimer.textContent = `Next update in: ${countdown} seconds`;
    }, 1000);

    updateTimeout = setTimeout(() => {
        stopAutoUpdate();
        alert('Auto-update stopped after 15 minutes.');
    }, 15 * 60 * 1000);

    document.getElementById('stopUpdateButton').style.display = 'inline';
    countdownTimer.style.display = 'inline';
});

document.getElementById('stopUpdateButton').addEventListener('click', stopAutoUpdate);

document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const icao = document.getElementById('icao').value.trim().toUpperCase();

    if (!icao) {
        alert('Please enter a valid ICAO code.');
        return;
    }

    stopAutoUpdate();
    await fetchAndUpdateFlights(icao);
});

// ============================
// Helper and Calculation Functions
// ============================

function stopAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    if (updateTimeout) clearTimeout(updateTimeout);
    if (countdownInterval) clearInterval(countdownInterval);

    updateInterval = null;
    updateTimeout = null;
    countdownInterval = null;

    document.getElementById('stopUpdateButton').style.display = 'none';
    document.getElementById('countdownTimer').style.display = 'none';
}

async function fetchAndUpdateFlights(icao) {
    try {
        document.getElementById('atisMessage').style.display = 'block';
        document.getElementById('controllersList').style.display = 'block';

        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);
        const airportCoordinates = await fetchAirportCoordinates(icao);

        await updateDistancesAndETAs(flights, airportCoordinates);
        allFlights = flights;

        renderFlightsTable(allFlights);

        await fetchAirportATIS(icao);
        await fetchControllers(icao);
    } catch (error) {
        console.error('Error fetching flights or controllers:', error.message);
    }
}

async function updateDistancesAndETAs(flights, airportCoordinates) {
    flights.forEach(flight => {
        flight.distanceToDestination = Math.ceil(
            calculateDistance(
                flight.latitude,
                flight.longitude,
                airportCoordinates.latitude,
                airportCoordinates.longitude
            )
        );
        flight.etaMinutes = calculateETA(flight.distanceToDestination, flight.speed);
        flight.headingFromAirport = calculateBearing(
            airportCoordinates.latitude,
            airportCoordinates.longitude,
            flight.latitude,
            flight.longitude
        );
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3440;
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1), Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const toDegrees = (radians) => radians * (180 / Math.PI);

    const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
    const Δλ = toRadians(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function calculateETA(distance, groundSpeed) {
    if (groundSpeed > 0) {
        const totalSeconds = Math.round((distance / groundSpeed) * 3600);
        const totalMinutes = Math.floor(totalSeconds / 60);
        if (totalMinutes > 720) return '>12hrs';
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return 'N/A';
}

function parseETAInSeconds(eta) {
    if (!eta || eta === 'N/A') return Infinity;
    if (eta === '>12hrs') return 720 * 60;
    const [minutes, seconds] = eta.split(':').map(Number);
    return minutes * 60 + seconds;
}

// ============================
// Table Rendering
// ============================

function renderFlightsTable(flights, hideFilter = false) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    const uniqueFlights = [...new Map(flights.map(f => [f.flightId, f])).values()];

    if (!uniqueFlights.length) {
        tableBody.innerHTML = '<tr><td colspan="5">No inbound flights found.</td></tr>';
        return;
    }

    uniqueFlights.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

    uniqueFlights.forEach(flight => {
        const row = document.createElement('tr');

        const isWithinHeadingRange = boldHeadingEnabled &&
            filterHighlightByHeading &&
            flight.headingFromAirport >= boldedHeadings.minHeading &&
            flight.headingFromAirport <= boldedHeadings.maxHeading;

        const isWithinDistanceRange = (minDistance === null && maxDistance === null) || (
            typeof flight.distanceToDestination === 'number' &&
            flight.distanceToDestination >= (minDistance ?? 0) &&
            flight.distanceToDestination <= (maxDistance ?? Infinity)
        );

        const isVisible = (!hideFilter || isWithinHeadingRange) && isWithinDistanceRange;

        row.style.fontWeight = isWithinHeadingRange ? 'bold' : 'normal';
        row.style.display = isVisible ? '' : 'none';

        row.innerHTML = `
            <td>${flight.callsign || 'N/A'}</td>
            <td>${flight.speed?.toFixed(0) || 'N/A'}</td>
            <td>${flight.altitude?.toFixed(0) || 'N/A'}</td>
            <td>${Math.round(flight.headingFromAirport) || 'N/A'}</td>
            <td>${flight.etaMinutes || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });

    highlightCloseETAs(uniqueFlights);
}

// Highlight rows with close ETAs
function highlightCloseETAs(flights) {
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    rows.forEach(row => (row.style.backgroundColor = ''));

    flights.forEach((flight1, i) => {
        const row1 = rows[flights.indexOf(flight1)];
        if (i > 0) {
            const row2 = rows[flights.indexOf(flights[i - 1])];
            const timeDiff = Math.abs(parseETAInSeconds(flight1.etaMinutes) - parseETAInSeconds(flights[i - 1].etaMinutes));
            if (timeDiff <= 30) {
                row1.style.backgroundColor = '#fffa9f';
                row2.style.backgroundColor = '#fffa9f';
            }
        }
    });
}