const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8'; // Replace with the correct session ID
const API_KEY = 'kqcfcn5ors95bzrdhzezbm9n9hnxq0qk'; // Replace with your Infinite Flight API Key

let cachedFlightPlans = {}; // To store flight plans
let updateInterval = null; // To store the interval ID

// Fetch flight plan for a specific flight ID
async function fetchFlightPlan(flightId) {
    if (cachedFlightPlans[flightId]) {
        // Return cached flight plan if available
        return cachedFlightPlans[flightId];
    }

    const url = `${API_BASE_URL}/sessions/${SESSION_ID}/flights/${flightId}/flightplan`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching flight plan for flight ${flightId}: ${response.status}`);
        }

        const data = await response.json();
        if (data.errorCode !== 0) {
            throw new Error(`API returned error: ${data.errorCode}`);
        }

        const flightPlanItems = data.result.flightPlanItems || [];
        cachedFlightPlans[flightId] = flightPlanItems; // Cache the flight plan
        return flightPlanItems;
    } catch (error) {
        console.error('Error fetching flight plan:', error.message);
        return [];
    }
}

// Calculate cumulative distance using the flight plan waypoints
function calculateCumulativeDistance(currentLat, currentLon, flightPlanItems) {
    let totalDistance = 0;

    if (flightPlanItems.length > 0) {
        // Add distance from current position to the first waypoint
        const firstWaypoint = flightPlanItems[0].location;
        totalDistance += calculateDistance(
            currentLat,
            currentLon,
            firstWaypoint.latitude,
            firstWaypoint.longitude
        );

        // Add distances between consecutive waypoints
        for (let i = 0; i < flightPlanItems.length - 1; i++) {
            const wp1 = flightPlanItems[i].location;
            const wp2 = flightPlanItems[i + 1].location;
            totalDistance += calculateDistance(wp1.latitude, wp1.longitude, wp2.latitude, wp2.longitude);
        }
    }

    return totalDistance;
}

// Update distances using cached flight plans
async function updateDistancesWithFlightPlans(flights) {
    for (const flight of flights) {
        const flightPlanItems = await fetchFlightPlan(flight.flightId);

        if (flightPlanItems.length > 0) {
            flight.distanceToDestination = calculateCumulativeDistance(
                flight.latitude,
                flight.longitude,
                flightPlanItems
            );
        }
    }
}

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

// Render flight details in the table with sorting by ETA
function renderFlightsTable(flights) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    // Exclude flights with speed below 30 knots
    const filteredFlights = flights
        .filter(flight => flight.speed >= 30)
        .map(flight => {
            flight.etaMinutes = calculateETA(flight.distanceToDestination, flight.speed);
            return flight;
        });

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
        const eta = flight.etaMinutes !== null ? flight.etaMinutes : 'N/A';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${flight.callsign || 'N/A'}</td>
            <td>${flight.heading ? Math.round(flight.heading) : 'N/A'}</td>
            <td>${flight.speed?.toFixed(0) || 'N/A'}</td>
            <td>${(flight.speed / 666.739).toFixed(2) || 'N/A'}</td>
            <td>${flight.altitude?.toFixed(0) || 'N/A'}</td>
            <td>${flight.distanceToDestination?.toFixed(2) || 'N/A'}</td>
            <td>${eta}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Start automatic updates every 60 seconds
function startAutoUpdate(icao) {
    if (updateInterval) {
        clearInterval(updateInterval); // Clear any existing interval
    }

    // Set a new interval to update every 60 seconds
    updateInterval = setInterval(() => {
        fetchAndUpdateFlights(icao);
    }, 60000); // 60000 milliseconds = 60 seconds

    // Show "Stop Update" button
    document.getElementById('stopUpdateButton').style.display = 'inline';
}

// Stop automatic updates
function stopAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }

    // Hide "Stop Update" button
    document.getElementById('stopUpdateButton').style.display = 'none';
}

// Fetch and update the flights
async function fetchAndUpdateFlights(icao) {
    try {
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);
        await updateDistancesWithFlightPlans(flights);
        renderFlightsTable(flights);
    } catch (error) {
        console.error('Error:', error.message);
        alert('An error occurred while fetching flight data.');
    }
}

// Form submission handler
document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const icao = document.getElementById('icao').value.trim().toUpperCase();
    if (!icao) {
        alert('Please enter a valid ICAO code.');
        return;
    }

    stopAutoUpdate(); // Stop any ongoing auto-update when submitting a new search
    cachedFlightPlans = {}; // Clear cached flight plans for a new search
    await fetchAndUpdateFlights(icao);
});

// Update button handler
document.getElementById('updateButton').addEventListener('click', () => {
    const icao = document.getElementById('icao').value.trim().toUpperCase();
    if (!icao) {
        alert('Please enter a valid ICAO code before updating.');
        return;
    }

    startAutoUpdate(icao);
});

// Stop Update button handler
document.getElementById('stopUpdateButton').addEventListener('click', () => {
    stopAutoUpdate();
});