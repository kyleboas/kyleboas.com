const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8'; // Replace with the correct session ID
const API_KEY = 'kqcfcn5ors95bzrdhzezbm9n9hnxq0qk'; // Replace with your Infinite Flight API Key

let allFlights = []; // Store all flights globally
let headingFilterActive = false; // Track if heading-based hide/show filter is active
let boldedHeadings = { minHeading: null, maxHeading: null }; // Store the current bold heading range
let distanceFilterActive = false; // Track if distance-based filtering is active
let maxDistance = null; // Store the maximum allowed distance for filtering
let updateInterval = null; // To store the interval ID

// Fetch airport latitude and longitude
async function fetchAirportCoordinates(icao) {
    const url = `${API_BASE_URL}/airport/${icao}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching airport data: ${response.status}`);
        }

        const data = await response.json();
        if (data.errorCode !== 0) {
            throw new Error(`API returned error: ${data.errorCode}`);
        }

        const { latitude, longitude } = data.result;
        return { latitude, longitude };
    } catch (error) {
        console.error('Error fetching airport coordinates:', error.message);
        alert('Failed to fetch airport coordinates.');
        return null;
    }
}

// Calculate distance between two coordinates using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3440; // Earth's radius in nautical miles
    const toRadians = (degrees) => degrees * (Math.PI / 180);

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in nautical miles
}

// Calculate bearing from airport to aircraft
function calculateBearing(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const toDegrees = (radians) => radians * (180 / Math.PI);

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δλ = toRadians(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return (toDegrees(Math.atan2(y, x)) + 360) % 360; // Normalize to 0–360°
}

// Calculate ETA in MM:SS format
function calculateETA(distance, groundSpeed) {
    if (groundSpeed > 0) {
        const totalSeconds = Math.round((distance / groundSpeed) * 3600); // Convert to seconds
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`; // Format as MM:SS
    }
    return null; // Return null if ground speed is 0 or invalid
}

// Parse ETA in MM:SS format to total seconds
function parseETAInSeconds(eta) {
    if (!eta || eta === 'N/A') return Infinity; // Return Infinity for invalid ETAs
    const [minutes, seconds] = eta.split(':').map(Number);
    return minutes * 60 + seconds;
}

// Highlight rows based on ETA proximity
function highlightCloseETAs(flights) {
    const rows = document.querySelectorAll('#flightsTable tbody tr');

    // Reset row colors
    rows.forEach(row => {
        row.style.backgroundColor = ''; // Clear previous highlighting
    });

    // Compare consecutive flights' ETAs
    for (let i = 0; i < flights.length - 1; i++) {
        const eta1 = parseETAInSeconds(flights[i].etaMinutes);
        const eta2 = parseETAInSeconds(flights[i + 1].etaMinutes);

        // Highlight in yellow if within 30 seconds
        if (Math.abs(eta1 - eta2) <= 30) {
            rows[i].style.backgroundColor = '#fffa9f';
            rows[i + 1].style.backgroundColor = '#fffa9f';
        }
        // Highlight in grey if within 60 seconds but more than 30 seconds
        else if (Math.abs(eta1 - eta2) <= 60) {
            rows[i].style.backgroundColor = '#daceca';
            rows[i + 1].style.backgroundColor = '#daceca';
        }
    }
}

// Render flight details in the table
function renderFlightsTable(flights, hideFilter = false) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    if (flights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No inbound flights found.</td></tr>';
        return;
    }

    // Sort flights by ETA in ascending order
    flights.sort((a, b) => {
        const etaA = parseETAInSeconds(a.etaMinutes);
        const etaB = parseETAInSeconds(b.etaMinutes);
        return etaA - etaB;
    });

    flights.forEach(flight => {
        const row = document.createElement('tr');

        // Bold rows within the current bolded heading range
        const isBolded =
            boldedHeadings.minHeading !== null &&
            flight.headingFromAirport >= boldedHeadings.minHeading &&
            flight.headingFromAirport <= boldedHeadings.maxHeading;

        // Show/hide rows based on hide filter
        const isVisible =
            !hideFilter || isBolded;

        row.style.fontWeight = isBolded ? 'bold' : 'normal'; // Apply bold style
        row.style.display = isVisible ? '' : 'none'; // Apply hide/show filter

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

    // Highlight rows with close ETAs
    highlightCloseETAs(flights);
}

// Handle the bold heading button
document.getElementById('boldHeadingButton').addEventListener('click', () => {
    const minHeading = parseFloat(document.getElementById('minHeading').value);
    const maxHeading = parseFloat(document.getElementById('maxHeading').value);

    if (isNaN(minHeading) || isNaN(maxHeading)) {
        alert('Please enter valid min and max heading values.');
        return;
    }

    boldedHeadings = { minHeading, maxHeading }; // Update the bolded heading range
    renderFlightsTable(allFlights); // Re-render the table to apply bolding
});

// Handle the hide/show other aircraft button
document.getElementById('toggleHeadingButton').addEventListener('click', () => {
    headingFilterActive = !headingFilterActive; // Toggle the filter state
    renderFlightsTable(allFlights, headingFilterActive); // Apply the heading filter
});

// Fetch and update the flights
async function fetchAndUpdateFlights(icao) {
    try {
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);

        const airportCoordinates = await fetchAirportCoordinates(icao);
        await updateDistancesAndETAs(flights, airportCoordinates);

        allFlights = flights; // Store flights globally
        renderFlightsTable(allFlights); // Render table
    } catch (error) {
        console.error('Error fetching flights:', error.message);
    }
}

// Fetch inbound flight IDs from the airport status API
async function fetchInboundFlightIds(icao) {
    const url = `${API_BASE_URL}/sessions/${SESSION_ID}/airport/${icao}/status`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching inbound flights: ${response.status}`);
        }

        const data = await response.json();
        return data.result.inboundFlights || [];
    } catch (error) {
        console.error('Error in fetchInboundFlightIds:', error.message);
        alert('Failed to fetch inbound flight IDs.');
        return [];
    }
}

// Fetch all flights and filter by inbound flight IDs
async function fetchInboundFlightDetails(inboundFlightIds) {
    const url = `${API_BASE_URL}/sessions/${SESSION_ID}/flights`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching flight details: ${response.status}`);
        }

        const data = await response.json();

        // Filter flights that match the inbound flight IDs
        return data.result.filter(flight => inboundFlightIds.includes(flight.flightId));
    } catch (error) {
        console.error('Error in fetchInboundFlightDetails:', error.message);
        alert('Failed to fetch flight details.');
        return [];
    }
}

// Update distances, ETA, and heading from the airport
async function updateDistancesAndETAs(flights, airportCoordinates) {
    for (const flight of flights) {
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
    }
}

// Fetch and update flights
async function fetchAndUpdateFlights(icao) {
    try {
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);

        const airportCoordinates = await fetchAirportCoordinates(icao);
        await updateDistancesAndETAs(flights, airportCoordinates);

        allFlights = flights; // Store flights globally
        renderFlightsTable(allFlights); // Render table
    } catch (error) {
        console.error('Error fetching flights:', error.message);
    }
}

let updateInterval = null; // To store the update interval ID
let updateTimeout = null; // To store the 15-minute timeout
let countdownInterval = null; // To store the countdown interval

// Handle the "Update" button
document.getElementById('updateButton').addEventListener('click', () => {
    const icao = document.getElementById('icao').value.trim().toUpperCase();
    if (!icao) {
        alert('Please enter a valid ICAO code before updating.');
        return;
    }

    stopAutoUpdate(); // Stop any existing update cycle

    let countdown = 60; // Initial countdown value in seconds
    const countdownTimer = document.getElementById('countdownTimer');

    // Start auto-update every 60 seconds
    updateInterval = setInterval(() => {
        fetchAndUpdateFlights(icao);
        countdown = 60; // Reset countdown after each update
    }, 60000); // 1-minute interval

    // Start countdown timer
    countdownInterval = setInterval(() => {
        countdown--;
        countdownTimer.textContent = `Next update in: ${countdown} seconds`;
        if (countdown <= 0) countdown = 60; // Reset countdown if it reaches 0
    }, 1000); // Update every second

    // Set a timeout to stop auto-update after 15 minutes
    updateTimeout = setTimeout(() => {
        stopAutoUpdate();
        alert('Auto-update stopped after 15 minutes. Click "Update" to start again.');
    }, 15 * 60 * 1000); // 15 minutes in milliseconds

    document.getElementById('stopUpdateButton').style.display = 'inline'; // Show "Stop Update" button
    countdownTimer.style.display = 'inline'; // Show the countdown timer
});

// Handle the "Stop Update" button
document.getElementById('stopUpdateButton').addEventListener('click', stopAutoUpdate);

// Stop the auto-update process
function stopAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval); // Clear the interval
    if (updateTimeout) clearTimeout(updateTimeout); // Clear the timeout
    if (countdownInterval) clearInterval(countdownInterval); // Clear the countdown interval

    updateInterval = null;
    updateTimeout = null;
    countdownInterval = null;

    document.getElementById('stopUpdateButton').style.display = 'none'; // Hide "Stop Update" button
    document.getElementById('countdownTimer').style.display = 'none'; // Hide the countdown timer
}

// Handle form submission to prevent page reload
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const icao = document.getElementById('icao').value.trim().toUpperCase();
        if (!icao) {
            alert('Please enter a valid ICAO code.');
            return;
        }

        try {
            stopAutoUpdate(); // Stop existing updates
            await fetchAndUpdateFlights(icao); // Fetch and render flights
        } catch (error) {
            console.error('Error during search:', error.message);
            alert('An error occurred while fetching data.');
        }
    });
});



