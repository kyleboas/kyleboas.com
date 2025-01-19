const PROXY_URL = 'https://infiniteflightapi.deno.dev/';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8';

let allFlights = [];
let boldHeadingEnabled = false;
let boldedHeadings = { minHeading: 90, maxHeading: 270 };
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

/** Cache Utilities */
function setCache(key, value, type) {
    cache[type][key] = { value, timestamp: Date.now() };
}

function getCache(key, type, expiration) {
    const entry = cache[type][key];
    if (!entry || isCacheExpired(entry.timestamp, expiration)) {
        delete cache[type][key];
        return null;
    }
    return entry.value;
}

function isCacheExpired(timestamp, expiration) {
    return Date.now() - timestamp > expiration;
}

/** Helper Functions */
function updateButtonText(buttonId, enabledText, disabledText, condition) {
    document.getElementById(buttonId).textContent = condition ? enabledText : disabledText;
}

function isInHeadingRange(flight) {
    return (
        boldHeadingEnabled &&
        flight.headingFromAirport >= boldedHeadings.minHeading &&
        flight.headingFromAirport <= boldedHeadings.maxHeading
    );
}

function isWithinDistanceRange(flight) {
    return (
        (minDistance === null && maxDistance === null) ||
        (flight.distanceToDestination >= (minDistance ?? 0) &&
            flight.distanceToDestination <= (maxDistance ?? Infinity))
    );
}

/** Fetch Functions */
async function fetchWithProxy(endpoint) {
    try {
        const response = await fetch(`${PROXY_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Error fetching data: ${response.status}\n${errorData}`);
        }
        const textResponse = await response.text();
        return JSON.parse(textResponse);
    } catch (error) {
        console.error('Error communicating with proxy:', error.message);
        throw error;
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

/** Rendering Functions */
function renderFlightsTable(flights) {
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
        const isWithinHeading = isInHeadingRange(flight);
        const isVisible = (!hideOtherAircraft || isWithinHeading) && isWithinDistanceRange(flight);

        row.style.fontWeight = isWithinHeading ? 'bold' : 'normal';
        row.style.display = isVisible ? '' : 'none';

        row.innerHTML = `
            <td>${flight.callsign || 'N/A'}</td>
            <td>${flight.speed?.toFixed(0) || 'N/A'} / ${(flight.speed / 666.739).toFixed(2) || 'N/A'}</td>
            <td>${flight.altitude?.toFixed(0) || 'N/A'}</td>
            <td>${Math.round(flight.headingFromAirport) || 'N/A'} / ${Math.ceil(flight.distanceToDestination) || 'N/A'}</td>
            <td>${flight.etaMinutes || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });

    applyRowHighlighting(uniqueFlights);
}

function applyRowHighlighting(flights) {
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    rows.forEach(row => (row.style.backgroundColor = ''));

    let groups = [flights];
    if (boldHeadingEnabled) {
        groups = [
            flights.filter(f => isInHeadingRange(f)),
            flights.filter(f => !isInHeadingRange(f)),
        ];
    }

    groups.forEach(group => {
        group.forEach((flight, i) => {
            const row = rows[flights.indexOf(flight)];
            if (row.style.display === 'none') return;

            if (i > 0) highlightRowPair(flight, group[i - 1], rows, flights);
            if (i < group.length - 1) highlightRowPair(flight, group[i + 1], rows, flights);
        });
    });
}

function highlightRowPair(flight1, flight2, rows, flights) {
    const row1 = rows[flights.indexOf(flight1)];
    const row2 = rows[flights.indexOf(flight2)];

    if (row1.style.display === 'none' || row2.style.display === 'none') return;

    const eta1 = parseETAInSeconds(flight1.etaMinutes);
    const eta2 = parseETAInSeconds(flight2.etaMinutes);
    const timeDiff = Math.abs(eta1 - eta2);

    if (timeDiff <= 30) {
        row1.style.backgroundColor = '#fffa9f';
        row2.style.backgroundColor = '#fffa9f';
    } else if (timeDiff <= 60) {
        row1.style.backgroundColor = row1.style.backgroundColor || '#daceca';
        row2.style.backgroundColor = row2.style.backgroundColor || '#daceca';
    } else if (timeDiff <= 120) {
        row1.style.backgroundColor = row1.style.backgroundColor || '#eaeaea';
        row2.style.backgroundColor = row2.style.backgroundColor || '#eaeaea';
    }
}

/** Event Listeners */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('boldHeadingButton').addEventListener('click', () => {
        boldHeadingEnabled = !boldHeadingEnabled;
        updateButtonText('boldHeadingButton', 'Disable Bold Aircraft', 'Enable Bold Aircraft', boldHeadingEnabled);
        renderFlightsTable(allFlights);
    });

    document.getElementById('applyDistanceFilterButton').addEventListener('click', () => {
        minDistance = parseFloat(document.getElementById('minDistance').value) || null;
        maxDistance = parseFloat(document.getElementById('maxDistance').value) || null;
        renderFlightsTable(allFlights);
    });

    document.getElementById('filterHeadingHighlightButton').addEventListener('click', () => {
        boldHeadingEnabled = !boldHeadingEnabled;
        updateButtonText(
            'filterHeadingHighlightButton',
            'Disable Highlight Filter by Heading',
            'Enable Highlight Filter by Heading',
            boldHeadingEnabled
        );
        renderFlightsTable(allFlights);
    });
});

/** Utility Functions */
function parseETAInSeconds(eta) {
    if (!eta || eta === 'N/A') return Infinity;
    if (eta === '>12hrs') return 720 * 60;
    const [minutes, seconds] = eta.split(':').map(Number);
    return minutes * 60 + seconds;
}