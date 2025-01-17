const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8'; // Replace with the correct session ID
const API_KEY = 'kqcfcn5ors95bzrdhzezbm9n9hnxq0qk'; // Replace with your Infinite Flight API Key

let allFlights = []; // Store all flights globally
let headingFilterActive = false; // Track if heading-based filter is active
let distanceFilterActive = false; // Track if distance-based filter is active

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

// Update distances and ETA for each flight
async function updateDistancesAndETAs(flights, airportCoordinates) {
    for (const flight of flights) {
        flight.distanceToDestination = calculateDistance(
            flight.latitude,
            flight.longitude,
            airportCoordinates.latitude,
            airportCoordinates.longitude
        );
        flight.etaMinutes = calculateETA(flight.distanceToDestination, flight.speed);
    }
}

// Render flight details in the table with optional filters
function renderFlightsTable(flights, headingFilter = null, distanceFilter = null) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    // Apply heading filter if active
    let filteredFlights = headingFilter
        ? flights.filter(flight => flight.heading >= headingFilter.minHeading && flight.heading <= headingFilter.maxHeading)
        : flights;

    // Apply distance filter if active
    if (distanceFilter) {
        filteredFlights = filteredFlights.filter(
            flight => flight.distanceToDestination >= distanceFilter.minDistance && flight.distanceToDestination <= distanceFilter.maxDistance
        );
    }

    if (filteredFlights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No inbound flights found.</td></tr>';
        return;
    }

    // Sort flights by ETA in ascending order
    filteredFlights.sort((a, b) => {
        const etaA = a.etaMinutes !== null ? parseInt(a.etaMinutes.split(':')[0]) * 60 + parseInt(a.etaMinutes.split(':')[1]) : Infinity;
        const etaB = b.etaMinutes !== null ? parseInt(b.etaMinutes.split(':')[0]) * 60 + parseInt(b.etaMinutes.split(':')[1]) : Infinity;
        return etaA - etaB;
    });

    filteredFlights.forEach(flight => {
        const row = document.createElement('tr');

        // Bold rows that match the heading filter
        const isHeadingMatched = headingFilter && flight.heading >= headingFilter.minHeading && flight.heading <= headingFilter.maxHeading;
        row.style.fontWeight = isHeadingMatched ? 'bold' : 'normal';

        row.innerHTML = `
            <td>${flight.callsign || 'N/A'}</td>
            <td>${flight.heading ? Math.round(flight.heading) : 'N/A'}</td>
            <td>${flight.speed?.toFixed(0) || 'N/A'}</td>
            <td>${(flight.speed / 666.739).toFixed(2) || 'N/A'}</td>
            <td>${flight.altitude?.toFixed(0) || 'N/A'}</td>
            <td>${flight.distanceToDestination?.toFixed(2) || 'N/A'}</td>
            <td>${flight.etaMinutes || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Bold Aircraft Within Heading Criteria
document.getElementById('boldHeadingButton').addEventListener('click', () => {
    const minHeading = parseFloat(document.getElementById('minHeading').value);
    const maxHeading = parseFloat(document.getElementById('maxHeading').value);

    if (isNaN(minHeading) || isNaN(maxHeading)) {
        alert('Please enter valid min and max heading values.');
        return;
    }

    // Re-render the table with bolding applied
    renderFlightsTable(allFlights, { minHeading, maxHeading });
});

// Hide/Show Aircraft Not Matching Heading Criteria
document.getElementById('toggleHeadingButton').addEventListener('click', () => {
    headingFilterActive = !headingFilterActive; // Toggle the filter state
    const minHeading = parseFloat(document.getElementById('minHeading').value);
    const maxHeading = parseFloat(document.getElementById('maxHeading').value);

    if (isNaN(minHeading) || isNaN(maxHeading)) {
        alert('Please enter valid min and max heading values.');
        return;
    }

    // Apply or remove the heading filter based on the toggle state
    renderFlightsTable(allFlights, headingFilterActive ? { minHeading, maxHeading } : null);
});

// Hide Aircraft Based on Distance to Destination
document.getElementById('applyDistanceFilterButton').addEventListener('click', () => {
    const minDistance = parseFloat(document.getElementById('minDistance').value);
    const maxDistance = parseFloat(document.getElementById('maxDistance').value);

    if (isNaN(minDistance) || isNaN(maxDistance)) {
        alert('Please enter valid min and max distance values.');
        return;
    }

    distanceFilterActive = true; // Activate the distance filter
    renderFlightsTable(allFlights, headingFilterActive ? { minHeading, maxHeading } : null, { minDistance, maxDistance });
});

// Fetch and update the flights
async function fetchAndUpdateFlights(icao) {
    try {
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);

        // Calculate distance and ETA for each flight
        await updateDistancesAndETAs(flights, await fetchAirportCoordinates(icao));
        allFlights = flights; // Store all flights globally
        renderFlightsTable(allFlights); // Initial rendering without filters
    } catch (error) {
        console.error('Error:', error.message);
        alert('An error occurred while fetching flight data.');
    }
}