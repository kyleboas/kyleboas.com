const PROXY_URL = 'https://infiniteflightapi.deno.dev';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8';

let allFlights = [];
let headingFilterActive = false;
let boldedHeadings = { minHeading: null, maxHeading: null };
let distanceFilterActive = false;
let maxDistance = null;
let updateInterval = null;
let updateTimeout = null;
let countdownInterval = null;

// Fetch data using the proxy
async function fetchWithProxy(endpoint, method = 'GET', body = null) {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, method, body }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error from proxy:', errorData);
            throw new Error(`Error fetching data: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error communicating with proxy:', error.message);
        throw error;
    }
}

// Fetch airport latitude and longitude
async function fetchAirportCoordinates(icao) {
    try {
        const data = await fetchWithProxy(`/airport/${icao}`, 'GET');
        return { latitude: data.result.latitude, longitude: data.result.longitude };
    } catch (error) {
        console.error('Error fetching airport coordinates:', error.message);
        alert('Failed to fetch airport coordinates.');
        return null;
    }
}

// Calculate distance using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3440; // Earth's radius in nautical miles
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1), Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate bearing
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

// Calculate ETA
function calculateETA(distance, groundSpeed) {
    if (groundSpeed > 0) {
        const totalSeconds = Math.round((distance / groundSpeed) * 3600);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return null;
}

// Parse ETA to seconds
function parseETAInSeconds(eta) {
    if (!eta || eta === 'N/A') return Infinity;
    const [minutes, seconds] = eta.split(':').map(Number);
    return minutes * 60 + seconds;
}

// Highlight rows based on ETA proximity
function highlightCloseETAs(flights) {
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    rows.forEach(row => (row.style.backgroundColor = ''));

    flights.forEach((flight1, i) => {
        flights.forEach((flight2, j) => {
            if (i !== j) {
                const eta1 = parseETAInSeconds(flight1.etaMinutes);
                const eta2 = parseETAInSeconds(flight2.etaMinutes);

                const timeDiff = Math.abs(eta1 - eta2);
                if (timeDiff <= 30) {
                    rows[i].style.backgroundColor = '#fffa9f'; // Yellow
                    rows[j].style.backgroundColor = '#fffa9f'; // Yellow
                } else if (timeDiff <= 60) {
                    rows[i].style.backgroundColor = rows[i].style.backgroundColor || '#daceca'; // Beige
                    rows[j].style.backgroundColor = rows[j].style.backgroundColor || '#daceca'; // Beige
                }
            }
        });
    });
}

// Render flight details
function renderFlightsTable(flights, hideFilter = false) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    if (!flights.length) {
        tableBody.innerHTML = '<tr><td colspan="8">No inbound flights found.</td></tr>';
        return;
    }

    flights.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

    flights.forEach(flight => {
        const row = document.createElement('tr');
        const isBolded = boldedHeadings.minHeading !== null &&
                         flight.headingFromAirport >= boldedHeadings.minHeading &&
                         flight.headingFromAirport <= boldedHeadings.maxHeading;

        const isVisible = !hideFilter || isBolded;
        row.style.fontWeight = isBolded ? 'bold' : 'normal';
        row.style.display = isVisible ? '' : 'none';

        row.innerHTML = `
            <td>${flight.callsign || 'N/A'}</td>
            <td>${Math.round(flight.headingFromAirport) || 'N/A'}</td>
            <td>${flight.speed?.toFixed(0) || 'N/A'}</td>
            <td>${(flight.speed / 666.739).toFixed(2) || 'N/A'}</td>
            <td>${flight.altitude?.toFixed(0) || 'N/A'}</td>
            <td>${flight.distanceToDestination?.toFixed(2) || 'N/A'}</td>
            <td>${flight.etaMinutes || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });

    highlightCloseETAs(flights);
}

// Fetch inbound flight IDs
async function fetchInboundFlightIds(icao) {
    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`, 'GET');
        return data.result.inboundFlights || [];
    } catch (error) {
        console.error('Error fetching inbound flight IDs:', error.message);
        alert('Failed to fetch inbound flight IDs.');
        return [];
    }
}

// Fetch inbound flight details
async function fetchInboundFlightDetails(inboundFlightIds) {
    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/flights`, 'GET');
        return data.result.filter(flight => inboundFlightIds.includes(flight.flightId));
    } catch (error) {
        console.error('Error fetching flight details:', error.message);
        alert('Failed to fetch flight details.');
        return [];
    }
}

// Update distances, ETA, and headings
async function updateDistancesAndETAs(flights, airportCoordinates) {
    flights.forEach(flight => {
        flight.distanceToDestination = calculateDistance(
            flight.latitude,
            flight.longitude,
            airportCoordinates.latitude,
            airportCoordinates.longitude
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

// Fetch and update flights
async function fetchAndUpdateFlights(icao) {
    try {
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);
        const airportCoordinates = await fetchAirportCoordinates(icao);

        await updateDistancesAndETAs(flights, airportCoordinates);
        allFlights = flights;

        renderFlightsTable(allFlights);
    } catch (error) {
        console.error('Error fetching flights:', error.message);
    }
}

// Start and stop auto-update
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
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

    document.getElementById('updateButton').addEventListener('click', () => {
        const icao = document.getElementById('icao').value.trim().toUpperCase();
        if (!icao) {
            alert('Please enter a valid ICAO code before updating.');
            return;
        }

        stopAutoUpdate();
        let countdown = 60;
        const countdownTimer = document.getElementById('countdownTimer');

        updateInterval = setInterval(() => {
            fetchAndUpdateFlights(icao);
            countdown = 60;
        }, 60000);

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
});


fetch('https://infiniteflightapi.deno.dev', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: '/airport/KATL', method: 'GET' })
})
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => console.log('Response:', data))
    .catch(error => console.error('Error:', error));