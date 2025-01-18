const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8'; // Replace with the correct session ID
const API_KEY = 'kqcfcn5ors95bzrdhzezbm9n9hnxq0qk';

let allFlights = [];
let headingFilterActive = false;
let boldedHeadings = { minHeading: null, maxHeading: null };
let distanceFilterActive = false;
let maxDistance = null;
let updateInterval = null;
let updateTimeout = null;
let countdownInterval = null;
let currentPage = 1;
const pageSize = 10;

// Debounce function to throttle API requests
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Toggle loading spinner
function toggleLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'block' : 'none';
}

// Toggle button state
function toggleButtons(disable) {
    document.getElementById('searchForm').querySelector('button').disabled = disable;
    document.getElementById('updateButton').disabled = disable;
}

// Show notifications
function showNotification(message, type = 'error') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        container.removeChild(notification);
    }, 3000);
}

// Fetch airport latitude and longitude
async function fetchAirportCoordinates(icao) {
    try {
        const response = await fetch(`${API_BASE_URL}/airport/${icao}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error(`Error fetching airport data: ${response.status}`);
        const data = await response.json();
        return { latitude: data.result.latitude, longitude: data.result.longitude };
    } catch (error) {
        console.error('Error fetching airport coordinates:', error.message);
        showNotification('Failed to fetch airport coordinates.', 'error');
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
                    rows[j].style.backgroundColor = rows[j].style.backgroundColor || '#daceca';
                }
            }
        });
    });
}

// Paginate array
function paginate(array, page, pageSize) {
    return array.slice((page - 1) * pageSize, page * pageSize);
}

// Render flight details with pagination
function renderFlightsTable(flights) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    if (!flights.length) {
        tableBody.innerHTML = '<tr><td colspan="8">No inbound flights found.</td></tr>';
        return;
    }

    const paginatedFlights = paginate(flights, currentPage, pageSize);

    paginatedFlights.forEach(flight => {
        const row = document.createElement('tr');
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

    highlightCloseETAs(paginatedFlights);

    document.getElementById('paginationControls').innerHTML = `
        <button onclick="navigatePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
        <button onclick="navigatePage(1)" ${currentPage * pageSize >= flights.length ? 'disabled' : ''}>Next</button>
    `;
}

function navigatePage(direction) {
    currentPage += direction;
    renderFlightsTable(allFlights);
}

// Main fetch logic
async function fetchAndUpdateFlights(icao) {
    try {
        toggleButtons(true);
        toggleLoading(true);
        const airportCoordinates = await fetchAirportCoordinates(icao);
        const flights = []; // Simulate flight fetch here
        allFlights = flights.map(flight => ({
            ...flight,
            distanceToDestination: calculateDistance(flight.lat, flight.lon, airportCoordinates.lat, airportCoordinates.lon),
        }));
        renderFlightsTable(allFlights);
    } catch (e) { showNotification(e.message); }
}