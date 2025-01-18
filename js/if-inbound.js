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
    flightDetails: {},
    atis: {},
    controllers: {},
};

const cacheExpiration = {
    airportCoordinates: 90 * 24 * 60 * 60 * 1000, // 90 days
    inboundFlightIds: 5 * 60 * 1000, // 5 minutes
    atis: 30 * 60 * 1000, // 30 minutes
    controllers: 10 * 60 * 1000, // 10 minutes
};

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

// Fetch data using the proxy
async function fetchWithProxy(endpoint) {
    try {
        const response = await fetch(`${PROXY_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.text(); // Use `text` instead of `json`
            console.error('Error from proxy:', errorData);
            throw new Error(`Error fetching data: ${response.status}`);
        }

        const textResponse = await response.text(); // Get the response as text
        try {
            // Attempt to parse it as JSON
            return JSON.parse(textResponse);
        } catch {
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        console.error('Error communicating with proxy:', error.message);
        throw error;
    }
}

// Fetch and display active ATC airports with inbound flight counts
async function fetchActiveATCAirports() {
    const endpoint = `/sessions/${SESSION_ID}/world`;

    try {
        // Fetch data from the world endpoint
        const data = await fetchWithProxy(endpoint);

        // Extract ATC airports and sort by inbound flight count (descending)
        const activeAtcAirports = (data.result?.atcFacilities || [])
            .filter(facility => facility.inboundFlightsCount > 0)
            .map(facility => ({
                icao: facility.airportIcao,
                inboundCount: facility.inboundFlightsCount,
            }))
            .sort((a, b) => b.inboundCount - a.inboundCount);

        // Format the list for display
        const listContent = activeAtcAirports.map(
            airport => `${airport.icao}: ${airport.inboundCount}`
        ).join('\n');

        // Display the list in the HTML container
        const atcAirportsListElement = document.getElementById('atcAirportsList');
        const activeAtcAirportsContainer = document.getElementById('activeAtcAirports');
        atcAirportsListElement.textContent = listContent || 'No active ATC airports found.';
        activeAtcAirportsContainer.style.display = 'block';
    } catch (error) {
        console.error('Error fetching active ATC airports:', error.message);
        const atcAirportsListElement = document.getElementById('atcAirportsList');
        const activeAtcAirportsContainer = document.getElementById('activeAtcAirports');
        atcAirportsListElement.textContent = 'Failed to fetch active ATC airports.';
        activeAtcAirportsContainer.style.display = 'block';
    }
}

// Example: Fetch and display active ATC airports when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchActiveATCAirports();
});

// Fetch airport latitude and longitude
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

// Fetch ATIS
async function fetchAirportATIS(icao) {
    const atisElement = document.getElementById('atisMessage');
    if (atisElement) atisElement.textContent = 'Fetching ATIS...';

    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) {
        console.log('Using cached ATIS for', icao);
        displayATIS(cached); // Display cached ATIS
        return cached;
    }

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/atis`);
        const atis = data.result || 'ATIS not available'; // Use `data.result`
        setCache(icao, atis, 'atis');
        displayATIS(atis); // Display fetched ATIS
        return atis;
    } catch (error) {
        console.error('Error fetching ATIS:', error.message);
        displayATIS('ATIS not available');
        return 'ATIS not available';
    }
}

// Display ATIS
function displayATIS(atis) {
    const atisElement = document.getElementById('atisMessage');
    if (!atisElement) {
        console.error('ATIS display element not found.');
        return;
    }
    console.log('Displaying ATIS:', atis); // Debug log
    atisElement.textContent = `ATIS: ${atis}`;
}

// Fetch Controllers
async function fetchControllers(icao) {
    const cached = getCache(icao, 'controllers', cacheExpiration.controllers);
    if (cached) {
        console.log('Using cached controllers for', icao);
        displayControllers(cached); // Display cached controllers
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

        // Sort controllers based on the specified order
        const sortedControllers = controllers.sort((a, b) => {
            const order = ["ATIS", "Clearance", "Ground", "Tower", "Approach", "Departure", "Center", "Unknown"];
            const indexA = order.indexOf(a.frequencyName);
            const indexB = order.indexOf(b.frequencyName);
            return indexA - indexB;
        }).map(ctrl => `${ctrl.frequencyName}: ${ctrl.username}`);

        setCache(icao, sortedControllers, 'controllers');
        displayControllers(sortedControllers); // Display sorted controllers
        return sortedControllers;
    } catch (error) {
        console.error('Error fetching controllers:', error.message);
        displayControllers(['No active controllers available']);
        return [];
    }
}

// Display Controllers
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

// Fetch inbound flight IDs
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

// Fetch inbound flight details
async function fetchInboundFlightDetails(inboundFlightIds) {
    const uncachedIds = getUncachedIds(inboundFlightIds, 'flightDetails');
    const flightsFromCache = inboundFlightIds
        .map(id => cache.flightDetails[id]?.value)
        .filter(Boolean);

    try {
        const data = uncachedIds.length
            ? await fetchWithProxy(`/sessions/${SESSION_ID}/flights`)
            : { result: [] };

        const flightsFromApi = data.result.filter(flight => uncachedIds.includes(flight.flightId));

        // Add new details to cache
        flightsFromApi.forEach(flight => {
            setCache(flight.flightId, flight, 'flightDetails');
        });

        // Combine cached and new data, ensuring no duplicates
        const combinedFlights = [
            ...flightsFromCache,
            ...flightsFromApi,
        ].filter((flight, index, self) =>
            index === self.findIndex(f => f.flightId === flight.flightId)
        );

        return combinedFlights;
    } catch (error) {
        console.error('Error fetching flight details:', error.message);
        alert('Failed to fetch flight details.');
        return flightsFromCache; // Return cached flights even if API fails
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

// Filter Listener
document.getElementById('applyDistanceFilterButton').addEventListener('click', () => {
    const minInput = parseFloat(document.getElementById('minDistance').value);
    const maxInput = parseFloat(document.getElementById('maxDistance').value);

    if (!isNaN(minInput)) {
        minDistance = minInput;
    } else {
        minDistance = null; // Clear the filter if input is invalid or empty
    }

    if (!isNaN(maxInput)) {
        maxDistance = maxInput;
    } else {
        maxDistance = null; // Clear the filter if input is invalid or empty
    }

    // Re-render the table with the updated distance filter
    renderFlightsTable(allFlights, hideOtherAircraft);
});


// Render Flights
function renderFlightsTable(flights, hideFilter = false) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    // Use a Set to ensure unique flight IDs
    const uniqueFlights = [...new Map(flights.map(f => [f.flightId, f])).values()];

    if (!uniqueFlights.length) {
        tableBody.innerHTML = '<tr><td colspan="8">No inbound flights found.</td></tr>';
        return;
    }

    // Sort flights by ETA
    uniqueFlights.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

    uniqueFlights.forEach(flight => {
        const row = document.createElement('tr');

        // Check if the flight is within the heading range
        const isWithinHeadingRange = boldedHeadings.minHeading !== null &&
                                     boldedHeadings.maxHeading !== null &&
                                     typeof flight.headingFromAirport === 'number' &&
                                     flight.headingFromAirport >= boldedHeadings.minHeading &&
                                     flight.headingFromAirport <= boldedHeadings.maxHeading;

        // Check if the flight is within the distance range
        const isWithinDistanceRange = (minDistance === null && maxDistance === null) || (
            typeof flight.distanceToDestination === 'number' &&
            flight.distanceToDestination >= (minDistance ?? 0) &&
            flight.distanceToDestination <= (maxDistance ?? Infinity)
        );

        // Combine filters
        const isVisible = (!hideFilter || isWithinHeadingRange) && isWithinDistanceRange;

        row.style.fontWeight = isWithinHeadingRange ? 'bold' : 'normal';
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

    highlightCloseETAs(uniqueFlights);
}

document.getElementById('boldHeadingButton').addEventListener('click', () => {
    const minHeading = parseFloat(document.getElementById('minHeading').value);
    const maxHeading = parseFloat(document.getElementById('maxHeading').value);

    if (isNaN(minHeading) || isNaN(maxHeading) || minHeading > maxHeading) {
        alert('Please enter valid min and max headings.');
        return;
    }

    boldedHeadings.minHeading = minHeading;
    boldedHeadings.maxHeading = maxHeading;

    renderFlightsTable(allFlights);
});

document.getElementById('toggleHeadingButton').addEventListener('click', () => {
    hideOtherAircraft = !hideOtherAircraft;

    document.getElementById('toggleHeadingButton').textContent = hideOtherAircraft 
        ? 'Show All Aircraft' 
        : 'Hide Other Aircraft';

    renderFlightsTable(allFlights, hideOtherAircraft);
});

// Reset Range Filter

document.getElementById('resetDistanceFilterButton').addEventListener('click', () => {
    minDistance = null;
    maxDistance = null;

document.getElementById('minDistance').value = '';
    document.getElementById('maxDistance').value = '';

    renderFlightsTable(allFlights, hideOtherAircraft);
});

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
        // Unhide the ATIS and controllers elements
        document.getElementById('atisMessage').style.display = 'block';
        document.getElementById('controllersList').style.display = 'block';

        // Fetch flights, ATIS, and controllers
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);
        const airportCoordinates = await fetchAirportCoordinates(icao);

        await updateDistancesAndETAs(flights, airportCoordinates);
        allFlights = flights;

        renderFlightsTable(allFlights);

        // Fetch ATIS and controllers
        await fetchAirportATIS(icao);
        await fetchControllers(icao);
    } catch (error) {
        console.error('Error fetching flights or controllers:', error.message);
    }
}

// Stop auto-update
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

        updateInterval = setInterval(async () => {
    await fetchAndUpdateFlights(icao);
    await fetchControllers(icao); // Update controllers on auto-update
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