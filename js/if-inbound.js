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

// Utility functions
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

function updateButtonText(buttonId, enabledText, disabledText, condition) {
    document.getElementById(buttonId).textContent = condition ? enabledText : disabledText;
}

function parseETAInSeconds(eta) {
    if (!eta || eta === 'N/A') return Infinity;
    if (eta === '>12hrs') return 720 * 60;
    const [minutes, seconds] = eta.split(':').map(Number);
    return minutes * 60 + seconds;
}

function isInHeadingRange(flight) {
    return boldHeadingEnabled &&
        flight.headingFromAirport >= boldedHeadings.minHeading &&
        flight.headingFromAirport <= boldedHeadings.maxHeading;
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

        if (totalMinutes > 720) {
            return '>12hrs';
        }

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return 'N/A';
}

// Highlighting rows based on ETA proximity
function highlightCloseETAs(flights) {
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    rows.forEach(row => (row.style.backgroundColor = ''));

    let group1 = flights;
    let group2 = [];

    if (boldHeadingEnabled) {
        group1 = flights.filter(flight =>
            flight.headingFromAirport >= boldedHeadings.minHeading &&
            flight.headingFromAirport <= boldedHeadings.maxHeading
        );

        group2 = flights.filter(flight =>
            flight.headingFromAirport < boldedHeadings.minHeading ||
            flight.headingFromAirport > boldedHeadings.maxHeading
        );
    }

    [group1, group2].forEach(group => {
        group.forEach((flight1, i) => {
            const row1 = rows[flights.indexOf(flight1)];
            if (row1.style.display === 'none') return;

            if (i > 0) highlightPair(flight1, group[i - 1], rows, flights);
            if (i < group.length - 1) highlightPair(flight1, group[i + 1], rows, flights);
        });
    });
}

function highlightPair(flight1, flight2, rows, flights) {
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

// Render flights table
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

        const isWithinHeadingRange = isInHeadingRange(flight);

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
            <td>${flight.speed?.toFixed(0) || 'N/A'} / ${(flight.speed / 666.739).toFixed(2) || 'N/A'}</td>
            <td>${flight.altitude?.toFixed(0) || 'N/A'}</td>
            <td>${Math.round(flight.headingFromAirport) || 'N/A'} / ${Math.ceil(flight.distanceToDestination) || 'N/A'}</td>
            <td>${flight.etaMinutes || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });

    highlightCloseETAs(uniqueFlights);
}