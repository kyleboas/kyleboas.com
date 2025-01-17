const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8'; // Replace with the correct session ID
const API_KEY = 'kqcfcn5ors95bzrdhzezbm9n9hnxq0qk'; // Replace with your Infinite Flight API Key

let allFlights = []; // Store all flights globally
let headingFilterActive = false; // Track if heading-based hide/show filter is active
let boldedHeadings = { minHeading: null, maxHeading: null }; // Store the current bold heading range
let updateInterval = null; // To store the interval ID
let countdownInterval = null; // To store the countdown interval ID
const updateFrequency = 60; // Update frequency in seconds

// Update the countdown timer
function startCountdown() {
    let timeLeft = updateFrequency;

    // Update the countdown every second
    countdownInterval = setInterval(() => {
        document.getElementById('countdownTimer').innerText = `Next update in: ${timeLeft} seconds`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(countdownInterval); // Stop the countdown when it reaches 0
        }
    }, 1000);
}

// Stop the countdown timer
function stopCountdown() {
    clearInterval(countdownInterval);
    document.getElementById('countdownTimer').innerText = ''; // Clear the countdown text
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

// Fetch and update the flights
async function fetchAndUpdateFlights(icao) {
    try {
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);

        // Calculate distance, ETA, and heading from the airport for each flight
        const airportCoordinates = await fetchAirportCoordinates(icao);
        await updateDistancesAndETAs(flights, airportCoordinates);

        allFlights = flights; // Store all flights globally
        renderFlightsTable(allFlights); // Initial rendering without filters
    } catch (error) {
        console.error('Error:', error.message);
        alert('An error occurred while fetching flight data.');
    }
}

// Start automatic updates every 60 seconds
function startAutoUpdate(icao) {
    if (updateInterval) {
        clearInterval(updateInterval); // Clear any existing interval
    }

    updateInterval = setInterval(async () => {
        await fetchAndUpdateFlights(icao);
        startCountdown(); // Restart countdown after each update
    }, updateFrequency * 1000);

    startCountdown(); // Start the countdown
    document.getElementById('stopUpdateButton').style.display = 'inline'; // Show "Stop Update" button
}

// Stop automatic updates
function stopAutoUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }

    stopCountdown(); // Stop the countdown
    document.getElementById('stopUpdateButton').style.display = 'none'; // Hide "Stop Update" button
}

// Handle the form submission to prevent page reload
document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    const icao = document.getElementById('icao').value.trim().toUpperCase();
    if (!icao) {
        alert('Please enter a valid ICAO code.');
        return;
    }

    try {
        // Stop any ongoing auto-update when a new search is initiated
        stopAutoUpdate();

        // Fetch and update the flights
        await fetchAndUpdateFlights(icao);

        // Start auto-update for the current ICAO
        startAutoUpdate(icao);
    } catch (error) {
        console.error('Error during search:', error.message);
        alert('An error occurred while processing your request.');
    }
});