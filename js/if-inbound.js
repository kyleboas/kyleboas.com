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

// ============================
// Cookie Utility Functions
// ============================

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split('; ');
    const cookie = cookies.find((c) => c.startsWith(`${name}=`));
    return cookie ? cookie.split('=')[1] : null;
}

// ============================
// Default Settings
// ============================

function applyDefaults() {
    const defaultMinHeading = parseFloat(getCookie('defaultMinHeading'));
    const defaultMaxHeading = parseFloat(getCookie('defaultMaxHeading'));
    const defaultMinDistance = parseFloat(getCookie('defaultMinDistance'));
    const defaultMaxDistance = parseFloat(getCookie('defaultMaxDistance'));

    if (!isNaN(defaultMinHeading) && !isNaN(defaultMaxHeading)) {
        document.getElementById('minHeading').value = defaultMinHeading;
        document.getElementById('maxHeading').value = defaultMaxHeading;
        boldHeadingEnabled = true;
        boldedHeadings.minHeading = defaultMinHeading;
        boldedHeadings.maxHeading = defaultMaxHeading;
        document.getElementById('boldHeadingButton').textContent = 'Disable Bold Aircraft';
    }

    if (!isNaN(defaultMinDistance) && !isNaN(defaultMaxDistance)) {
        document.getElementById('minDistance').value = defaultMinDistance;
        document.getElementById('maxDistance').value = defaultMaxDistance;
        minDistance = defaultMinDistance;
        maxDistance = defaultMaxDistance;
    }

    renderFlightsTable(allFlights); // Re-render the table with applied defaults
}

// Save default settings to cookies
document.getElementById('saveDefaultsButton').addEventListener('click', () => {
    const defaultMinHeading = document.getElementById('defaultMinHeading').value.trim();
    const defaultMaxHeading = document.getElementById('defaultMaxHeading').value.trim();
    const defaultMinDistance = document.getElementById('defaultMinDistance').value.trim();
    const defaultMaxDistance = document.getElementById('defaultMaxDistance').value.trim();

    if (defaultMinHeading !== '') setCookie('defaultMinHeading', defaultMinHeading, 30);
    if (defaultMaxHeading !== '') setCookie('defaultMaxHeading', defaultMaxHeading, 30);
    if (defaultMinDistance !== '') setCookie('defaultMinDistance', defaultMinDistance, 30);
    if (defaultMaxDistance !== '') setCookie('defaultMaxDistance', defaultMaxDistance, 30);

    alert('Defaults saved!');
});


// ============================
// Utility Functions
// ============================

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
// Aircraft
// ============================

const aircraftMachDetails = {
        "81d9ccd4-9c03-493a-811e-8fad3e57bd05": { name: "A-10", minMach: 0.40, maxMach: 0.56 },
        "876b428a-3ee2-46cd-9d8c-2c59424dfcb5": { name: "AC-130", minMach: 0.40, maxMach: 0.60 },
        "710c84ae-6fdc-4c4a-ac3b-4031c3036e98": { name: "A220-300", minMach: 0.72, maxMach: 0.82 },
        "982dd974-5be7-4369-90c6-bd92863632ba": { name: "A318", minMach: 0.70, maxMach: 0.82 },
        "2c2f162e-a7d9-4ebd-baf4-859aed36165a": { name: "A319", minMach: 0.70, maxMach: 0.82 },
        "a266b67f-03e3-4f8c-a2bb-b57cfd4b12f3": { name: "A320", minMach: 0.70, maxMach: 0.82 },
        "d7434d84-555a-4d9b-93a7-53c77cf846ea": { name: "A321", minMach: 0.70, maxMach: 0.82 },
        "6af2c9f8-abd8-4872-a9bc-4e79fd84fe77": { name: "A330-300", minMach: 0.78, maxMach: 0.86 },
        "474810ee-503c-44f2-a305-c176ec8cc431": { name: "A330-900", minMach: 0.78, maxMach: 0.86 },
        "230ec095-5e36-4637-ba2f-68831b31e891": { name: "A350-900", minMach: 0.78, maxMach: 0.89 },
        "f11ed126-bce8-46ef-9265-69191c354575": { name: "A380-800", minMach: 0.78, maxMach: 0.89 },
        "2ec6f8cd-fdb9-464f-87c2-808f778fdb1d": { name: "B737-700", minMach: 0.72, maxMach: 0.82 },
        "4f6fc40d-a5b5-43c5-b5ff-ff0000a878b2": { name: "B737-8 MAX", minMach: 0.72, maxMach: 0.82 },
        "f60a537d-5f83-4b68-8f66-b5f76d1e1775": { name: "B737-800", minMach: 0.72, maxMach: 0.82 },
        "64568366-b72c-47bd-8bf6-6fdb81b683f9": { name: "B737-900", minMach: 0.72, maxMach: 0.82 },
        "c82da702-ea61-4399-921c-34f35f3ca5c4": { name: "B747-200", minMach: 0.78, maxMach: 0.85 },
        "de510d3d-04f8-46e0-8d65-55b888f33129": { name: "B747-400", minMach: 0.78, maxMach: 0.92 },
        "9759c19f-8f18-40f5-80d1-03a272f98a3b": { name: "B747-8", minMach: 0.78, maxMach: 0.90 },
        "0d49ce9e-446a-4d12-b651-6983afdeeb40": { name: "B747-SCA", minMach: 0.55, maxMach: 0.60 },
        "3ee45d20-1984-4d95-a753-3696e35cdf77": { name: "B747-SOFIA", minMach: 0.75, maxMach: 0.85 },
        "ed29f26b-774e-471e-a23a-ecb9b6f5da74": { name: "B757-200", minMach: 0.70, maxMach: 0.86 },
        "bec63a00-a483-4427-a076-0f76dba0ee97": { name: "B777-200ER", minMach: 0.78, maxMach: 0.89 },
        "8290107b-d728-4fc3-b36e-0224c1780bac": { name: "B777-200LR", minMach: 0.78, maxMach: 0.89 },
        "e258f6d4-4503-4dde-b25c-1fb9067061e2": { name: "B777-300ER", minMach: 0.78, maxMach: 0.89 },
        "6925c030-a868-49cc-adc8-7025537c51ca": { name: "B777F", minMach: 0.78, maxMach: 0.89 },
        "c1ae3647-f56a-4dc4-9007-cc8b1a2697a5": { name: "B787-8", minMach: 0.78, maxMach: 0.90 },
        "61084cae-8aac-4da4-a7df-396ec6d9c870": { name: "B787-10", minMach: 0.78, maxMach: 0.90 },
        "3098345e-1152-4441-96ec-40a71179a24f": { name: "Dash-8 Q400", minMach: 0.45, maxMach: 0.66 },
        "ef677903-f8d3-414f-a190-233b2b855d46": { name: "C172", minMach: 0.15, maxMach: 0.20 },
        "206884f9-38a8-4118-a920-a7dcbd166c47": { name: "C208", minMach: 0.25, maxMach: 0.31 },
        "8bafde46-7e6e-44c5-800f-917237c49d75": { name: "XCub", minMach: 0.20, maxMach: 0.27 },
        "3f17ca35-b384-4391-aa5e-5beececb0612": { name: "TBM-930", minMach: 0.45, maxMach: 0.53 },
        "af055734-aaed-44ad-a2d0-5b9046f29d0d": { name: "E175", minMach: 0.70, maxMach: 0.82 },
        "7de22dcf-91dd-4932-b225-533298873df2": { name: "E190", minMach: 0.70, maxMach: 0.82 },
        "24364e52-3788-487f-9f98-00f38b1f459c": { name: "CRJ-200", minMach: 0.70, maxMach: 0.81 },
        "8f34680a-a4ad-4f21-91e9-3a932ab03ca4": { name: "CRJ-700", minMach: 0.70, maxMach: 0.82 },
        "b3907f6b-c8cf-427b-94fb-1f9365d990df": { name: "CRJ-1000", minMach: 0.70, maxMach: 0.82 },
        "e59fa7b4-b708-4480-aebd-26659a4f312b": { name: "DC-10", minMach: 0.78, maxMach: 0.88 },
        "e92bc6db-a9e6-4137-a93c-a7423715b799": { name: "SR22", minMach: 0.40, maxMach: 0.60 }
};

async function pairAircraftData(aircraftIds) {
    const pairedData = {};

    aircraftIds.forEach((id) => {
        const machDetails = aircraftMachDetails[id] || { minMach: "N/A", maxMach: "N/A" };
        pairedData[id] = {
            minMach: machDetails.minMach,
            maxMach: machDetails.maxMach,
        };
    });

    return pairedData;
}

// Get the aircraft IDs from `allFlights`
const aircraftIds = allFlights.map(flight => flight.aircraftId);

// Pair the aircraft data
pairAircraftData(aircraftIds).then(pairedData => {
    console.log("Paired Aircraft Data:", pairedData);
});


// ============================
// Fetch Functions
// ============================

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

// Fetch Aircraft Type
async function fetchAircraftType(aircraftId) {
    const endpoint = `/aircraft/${aircraftId}/liveries`;
    try {
        const response = await fetchWithProxy(endpoint);
        const result = response.result;

        if (result && result.length > 0) {
            return result[0].aircraftName; // Return the first result's aircraft name
        } else {
            console.warn(`No data found for aircraftId: ${aircraftId}`);
            return "Unknown Aircraft";
        }
    } catch (error) {
        console.error(`Error fetching aircraft type for ID ${aircraftId}:`, error.message);
        return "Unknown Aircraft";
    }
}

// Fetch and display the top 10 active ATC airports with inbound flight counts
async function fetchActiveATCAirports() {
    const endpoint = `/sessions/${SESSION_ID}/world`;

    try {
        // Fetch data from the world endpoint
        const data = await fetchWithProxy(endpoint);

        // Extract airports with active ATC and inbound flight counts
        const activeAtcAirports = (data.result || [])
            .filter(airport => airport.inboundFlightsCount > 0 || (airport.atcFacilities && airport.atcFacilities.length > 0)) // Include airports with inbound flights or active ATC
            .map(airport => ({
                icao: airport.airportIcao,
                inboundCount: airport.inboundFlightsCount || 0 // Default to 0 if no inbound flights
            }))
            .sort((a, b) => b.inboundCount - a.inboundCount); // Sort by inbound count (descending)

        // Remove duplicates by ensuring unique ICAO codes
        const uniqueAirports = Array.from(new Map(activeAtcAirports.map(airport => [airport.icao, airport])).values());

        // Limit the list to the top 5 airports
        const topAirports = uniqueAirports.slice(0, 5);

        // Format the list for display
        const listContent = topAirports.map(
            airport => `${airport.icao}: ${airport.inboundCount}`
        ).join(', '); // Join the entries with commas

        // Set the content inside the <pre> element
        const atcAirportsListElement = document.getElementById('atcAirportsList');
        atcAirportsListElement.textContent = listContent || 'No active ATC airports found.';
    } catch (error) {
        console.error('Error fetching active ATC airports:', error.message);

        // Display error message
        const atcAirportsListElement = document.getElementById('atcAirportsList');
        atcAirportsListElement.textContent = 'Failed to fetch active ATC airports.';
    }
}

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
    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/flights`);
        
        // Filter flights based on the provided IDs
        const flightsFromApi = data.result.filter(flight => inboundFlightIds.includes(flight.flightId));

        // Ensure only unique flight details are returned
        const uniqueFlights = [...new Map(flightsFromApi.map(f => [f.flightId, f])).values()];

        // Map relevant details
        return uniqueFlights.map(flight => ({
            flightId: flight.flightId,
            callsign: flight.callsign || "N/A",
            aircraftId: flight.aircraftId || "N/A",
            aircraftName: aircraftMachDetails[flight.aircraftId]?.name || "UNKN",
            latitude: flight.latitude || null,
            longitude: flight.longitude || null,
            altitude: Math.round(flight.altitude) || "N/A",
            speed: Math.round(flight.speed) || "N/A",
            heading: Math.round(flight.heading) || "N/A",
            lastReport: flight.lastReport || "N/A",
            virtualOrganization: flight.virtualOrganization || "N/A",
        }));
    } catch (error) {
        console.error("Error fetching flight details:", error.message);
        alert("Failed to fetch flight details.");
        return [];
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


// Update distances, ETA, and headings
async function updateDistancesAndETAs(flights, airportCoordinates) {
    flights.forEach((flight) => {
        if (
            !airportCoordinates ||
            !flight.latitude ||
            !flight.longitude ||
            flight.speed <= 0
        ) {
            flight.distanceToDestination = 'N/A';
            flight.etaMinutes = 'N/A';
            flight.headingFromAirport = 'N/A';
            return;
        }

        // Calculate distance to destination
        flight.distanceToDestination = Math.ceil(
            calculateDistance(
                flight.latitude,
                flight.longitude,
                airportCoordinates.latitude,
                airportCoordinates.longitude
            )
        );

        // Calculate ETA using dead reckoning
        flight.etaMinutes = calculateETA(
            flight.latitude,
            flight.longitude,
            airportCoordinates.latitude,
            airportCoordinates.longitude,
            flight.speed, 
            flight.heading
        );

        // Calculate heading from airport to aircraft
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

        // Fetch required data
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        if (!inboundFlightIds.length) {
            console.warn("No inbound flights found for ICAO:", icao);
            allFlights = []; // Reset global state
            renderFlightsTable(allFlights); // Clear table
            document.getElementById('atisMessage').textContent = "No ATIS available.";
            document.getElementById('controllersList').textContent = "No controllers available.";
            return;
        }

        const flights = await fetchInboundFlightDetails(inboundFlightIds);

        const airportCoordinates = await fetchAirportCoordinates(icao);

        if (!airportCoordinates) {
            console.warn("No coordinates found for airport ICAO:", icao);
            throw new Error("Failed to fetch airport coordinates.");
        }

        // Update distances, ETAs, and headings
        await updateDistancesAndETAs(flights, airportCoordinates);

        // Update global state and render table
        allFlights = flights; // Save to global state
        renderFlightsTable(allFlights); // Pass `allFlights` directly to the table renderer

        // Fetch and display ATIS and controllers
        await fetchAirportATIS(icao);
        await fetchControllers(icao);
    } catch (error) {
        console.error("Error fetching flights or controllers:", error.message);

        // Provide fallback for rendering the table and messages
        allFlights = [];
        renderFlightsTable(allFlights); // Clear table
        document.getElementById('atisMessage').textContent = "ATIS not available.";
        document.getElementById('controllersList').textContent = "No controllers online.";
    }
}

// ============================
// Calculations
// ============================

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
function calculateETA(currentLat, currentLon, destLat, destLon, groundSpeed, heading) {
    if (!groundSpeed || groundSpeed <= 0 || heading == null) {
        return 'N/A'; // Cannot calculate ETA without valid inputs
    }

    // Calculate the distance to the destination
    const distance = calculateDistance(currentLat, currentLon, destLat, destLon);
    if (!distance || distance <= 0) {
        return 'N/A'; // Cannot calculate ETA with invalid distance
    }

    // Calculate ETA in hours
    const timeInHours = distance / groundSpeed;

    // Convert hours to minutes and seconds
    const totalSeconds = Math.round(timeInHours * 3600);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    // Represent ETA above 12 hours
    if (totalMinutes > 720) {
        return '>12hrs';
    }

    // Format ETA as "minutes:seconds"
    return `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Parses ETA string in "minutes:seconds" format to total seconds
function parseETAInSeconds(eta) {
    if (typeof eta !== 'string' || eta === 'N/A' || eta.startsWith('>')) {
        return Number.MAX_SAFE_INTEGER; // Return a large number for invalid or undefined ETAs
    }

    const [minutes, seconds] = eta.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) {
        return Number.MAX_SAFE_INTEGER; // Return a large number for invalid formats
    }

    return minutes * 60 + seconds;
}


// ============================
// Display Functions
// ============================


// Display ATIS
function displayATIS(atis) {
    const atisElement = document.getElementById('atisMessage');
    if (!atisElement) {
        console.error('ATIS display element not found.');
        return;
    }
    atisElement.textContent = `ATIS: ${atis}`;
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


// ============================
// Organize
// ============================

// Toggle Bold Aircraft
let boldHeadingEnabled = false;
document.getElementById('boldHeadingButton').addEventListener('click', () => {
    boldHeadingEnabled = !boldHeadingEnabled;

    document.getElementById('boldHeadingButton').textContent = boldHeadingEnabled
        ? 'Disable Bold Aircraft'
        : 'Enable Bold Aircraft';

    renderFlightsTable(allFlights); // Re-render the table with updated bold styling
});


// ============================
// Highlight
// ============================

let headingHighlightFilterEnabled = false; // Toggle for bold filter

// Toggle bold filter on button click
document.getElementById('filterHeadingHighlightButton').addEventListener('click', () => {
    headingHighlightFilterEnabled = !headingHighlightFilterEnabled;

    // Update button text based on the filter state
    const button = document.getElementById('filterHeadingHighlightButton');
    button.innerText = headingHighlightFilterEnabled
        ? "Disable Highlight by Heading"
        : "Enable Highlight by Heading";

    // Call the highlight function to apply changes
    highlightCloseETAs();
});

// Highlight filtered ETAs
function highlightCloseETAs() {
    clearHighlights(); // Clear existing highlights

    const rows = document.querySelectorAll('#flightsTable tbody tr');

    if (headingHighlightFilterEnabled) {
        // Separate flights into bold and non-bold groups
        const boldFlights = allFlights.filter(flight =>
            flight.headingFromAirport >= boldedHeadings.minHeading &&
            flight.headingFromAirport <= boldedHeadings.maxHeading
        );
        const nonBoldFlights = allFlights.filter(flight =>
            flight.headingFromAirport < boldedHeadings.minHeading ||
            flight.headingFromAirport > boldedHeadings.maxHeading
        );

        // Compare within bold group
        compareFlightsWithinGroup(boldFlights, rows);

        // Compare within non-bold group
        compareFlightsWithinGroup(nonBoldFlights, rows);

        // Compare between groups
        compareBetweenGroups(boldFlights, nonBoldFlights, rows);
    } else {
        // Compare all flights together
        compareAllFlights(rows);
    }
}

// Compare flights within a group and apply highlights
function compareFlightsWithinGroup(group, rows) {
    // Sort flights by ETA
    group.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

    group.forEach((flight, index) => {
        const previousFlight = group[index - 1] || null; // Aircraft ahead
        const nextFlight = group[index + 1] || null; // Aircraft behind

        if (previousFlight) highlightPair(flight, previousFlight, rows); // Compare to previous
        if (nextFlight) highlightPair(flight, nextFlight, rows); // Compare to next
    });
}

// Compare flights between bold and non-bold groups
function compareBetweenGroups(boldGroup, nonBoldGroup, rows) {
    boldGroup.forEach(boldFlight => {
        nonBoldGroup.forEach(nonBoldFlight => {
            highlightPair(boldFlight, nonBoldFlight, rows);
        });
    });
}

// Compare all flights together (no bold filtering)
function compareAllFlights(rows) {
    // Sort flights by ETA
    allFlights.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

    allFlights.forEach((flight, index) => {
        const previousFlight = allFlights[index - 1] || null; // Aircraft ahead
        const nextFlight = allFlights[index + 1] || null; // Aircraft behind

        if (previousFlight) highlightPair(flight, previousFlight, rows); // Compare to previous
        if (nextFlight) highlightPair(flight, nextFlight, rows); // Compare to next
    });
}

// Highlight a pair of flights based on ETA difference
function highlightPair(flight1, flight2, rows) {
    const row1 = rows[allFlights.indexOf(flight1)];
    const row2 = rows[allFlights.indexOf(flight2)];

    // Skip hidden rows
    if (row1.style.display === 'none' || row2.style.display === 'none') return;

    const eta1 = parseETAInSeconds(flight1.etaMinutes);
    const eta2 = parseETAInSeconds(flight2.etaMinutes);
    const timeDiff = Math.abs(eta1 - eta2);

    // Apply highlights based on time difference
    if (timeDiff < 10) {
        row1.style.backgroundColor = row1.style.backgroundColor || '#fffa9f'; // Yellow for ≤ 10 seconds
        row2.style.backgroundColor = row2.style.backgroundColor || '#fffa9f';
    } else if (timeDiff < 30) {
        row1.style.backgroundColor = row1.style.backgroundColor || '#80daeb'; // Blue for ≤ 30 seconds
        row2.style.backgroundColor = row2.style.backgroundColor || '#80daeb';
    } else if (timeDiff < 60) {
        row1.style.backgroundColor = row1.style.backgroundColor || '#daceca'; // Beige for ≤ 60 seconds
        row2.style.backgroundColor = row2.style.backgroundColor || '#daceca';
    } else if (timeDiff < 120) {
        row1.style.backgroundColor = row1.style.backgroundColor || '#eaeaea'; // Gray for ≤ 120 seconds
        row2.style.backgroundColor = row2.style.backgroundColor || '#eaeaea';
    }
}

// Utility function to parse ETA in "minutes:seconds" format to total seconds
function parseETAInSeconds(eta) {
    if (typeof eta !== 'string' || eta === 'N/A') return Number.MAX_SAFE_INTEGER;

    const [minutes, seconds] = eta.split(':').map(Number);
    return minutes * 60 + seconds;
}

// Clear all highlights
function clearHighlights() {
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    rows.forEach(row => (row.style.backgroundColor = ''));
}

// ============================
// Event Listeners
// ============================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Add defensive checks for undefined DOM elements
        const boldHeadingButton = document.getElementById('boldHeadingButton');
        if (boldHeadingButton) {
            boldHeadingButton.addEventListener('click', () => {
                boldHeadingEnabled = !boldHeadingEnabled;
                boldHeadingButton.textContent = boldHeadingEnabled
                    ? 'Disable Bold Aircraft'
                    : 'Enable Bold Aircraft';

                if (Array.isArray(allFlights)) {
                    renderFlightsTable(allFlights); // Ensure allFlights is an array before passing
                }
            });
        }

        const manualUpdateButton = document.getElementById('manualUpdateButton');
        if (manualUpdateButton) {
            manualUpdateButton.addEventListener('click', async () => {
                const icaoInput = document.getElementById('icao');
                const icao = icaoInput ? icaoInput.value.trim().toUpperCase() : null;

                if (!icao) {
                    alert('Please enter a valid ICAO code.');
                    return;
                }

                try {
                    await fetchAirportATIS(icao);
                    await fetchControllers(icao);
                } catch (error) {
                    console.error('Error during manual update:', error.message);
                    alert('Failed to update ATIS and Controllers.');
                }
            });
        }

        await fetchActiveATCAirports(); // Fetch and display active ATC airports on load

        // Additional initialization code here...
    } catch (error) {
        console.error('Error initializing page:', error.message);
    }
});


// Toggle Apply Distance Filter
document.getElementById('applyDistanceFilterButton').addEventListener('click', () => {
    const minInput = parseFloat(document.getElementById('minDistance').value);
    const maxInput = parseFloat(document.getElementById('maxDistance').value);

    if (!isNaN(minInput)) {
        minDistance = minInput;
    } else {
        minDistance = null;
    }

    if (!isNaN(maxInput)) {
        maxDistance = maxInput;
    } else {
        maxDistance = null;
    }

    console.log('Applying Distance Filter:', { minDistance, maxDistance });

    // Re-render the table with updated filters
    renderFlightsTable(allFlights);
});

// ============================
// Table Rendering
// ============================

async function renderFlightsTable(allFlights, hideFilter = false) {
    const tableBody = document.querySelector("#flightsTable tbody");
    if (!tableBody) {
        console.error("Flights table body not found in DOM.");
        return;
    }

    tableBody.innerHTML = ""; // Clear the table before rendering

    if (!Array.isArray(allFlights) || allFlights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No inbound flights found.</td></tr>';
        return;
    }

    try {
        const aircraftIds = allFlights.map(flight => flight.aircraftId);
        const aircraftMachDetails = await pairAircraftData(aircraftIds);

        // Sort flights by ETA
        allFlights.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

        allFlights.forEach(flight => {
            const row = document.createElement("tr");

            // Extract flight details
            const aircraftName = flight.aircraftName || "UNKN";
            const machDetails = aircraftMachDetails[flight.aircraftId] || { minMach: "N/A", maxMach: "N/A" };

            // Check if flight is within the heading range
            const isWithinHeadingRange =
                boldHeadingEnabled &&
                boldedHeadings.minHeading !== null &&
                boldedHeadings.maxHeading !== null &&
                flight.headingFromAirport >= boldedHeadings.minHeading &&
                flight.headingFromAirport <= boldedHeadings.maxHeading;

            // Check if flight is within the distance range
            const isWithinDistanceRange =
        (minDistance === null || flight.distanceToDestination >= minDistance) &&
        (maxDistance === null || flight.distanceToDestination <= maxDistance);

            // Determine visibility based on the hide filter and distance range
            const isVisible = !hideFilter || isWithinDistanceRange;

            // Debugging visibility
            console.log(`Flight ${flight.callsign || 'N/A'} - Distance: ${flight.distanceToDestination}, Visible: ${isWithinDistanceRange}`);

            // Styling and visibility
            row.style.fontWeight = isWithinHeadingRange ? "bold" : "normal";
            row.style.display = isVisible ? "" : "none";
            row.style.display = isWithinDistanceRange ? '' : 'none';

            // Skip adding rows that should be hidden
            if (!isVisible) return;

            // Format values for display
            const speedValue = typeof flight.speed === "number" ? flight.speed.toFixed(0) : "N/A";
            const machValue = typeof flight.speed === "number" ? (flight.speed / 666.739).toFixed(2) : "N/A";
            const headingValue = typeof flight.headingFromAirport === "number" ? Math.round(flight.headingFromAirport) : "N/A";
            const altitudeValue = flight.altitude ? flight.altitude.toFixed(0) : "N/A";

            // Populate row HTML
            row.innerHTML = `
                <td>${flight.callsign || "N/A"}<br><small>${aircraftName}</small></td>
                <td>${machDetails.minMach}<br>${machDetails.maxMach}</td>
                <td>${speedValue}<br>${machValue}</td>
                <td>${headingValue}<br>${altitudeValue}</td>
                <td>${flight.distanceToDestination || "N/A"}<br>${flight.etaMinutes || "N/A"}</td>
            `;
            tableBody.appendChild(row);
        });

        highlightCloseETAs(); // Highlight flights with close ETAs
    } catch (error) {
        console.error("Error rendering the flights table:", error.message);
        tableBody.innerHTML = '<tr><td colspan="5">Error populating table. Check console for details.</td></tr>';
    }
}

// ============================
// End Table Rendering
// ============================

// ============================
// Apply Defaults on Page Load
// ============================

document.addEventListener('DOMContentLoaded', () => {
    applyDefaults();

    // Set dropdown button text if defaults exist
    const hasDefaults =
        getCookie('defaultMinHeading') ||
        getCookie('defaultMaxHeading') ||
        getCookie('defaultMinDistance') ||
        getCookie('defaultMaxDistance');

    if (hasDefaults) {
        document.getElementById('toggleDefaultsButton').textContent = '▲ Set Defaults';
        document.getElementById('defaultSettingsForm').style.display = 'block';
    }
});

document.getElementById('boldHeadingButton').addEventListener('click', () => {
    const minHeading = parseFloat(document.getElementById('minHeading').value);
    const maxHeading = parseFloat(document.getElementById('maxHeading').value);

    if (isNaN(minHeading) || isNaN(maxHeading) || minHeading > maxHeading) {
        alert('Please enter valid min and max headings.');
        return;
    }

    boldHeadingEnabled = !boldHeadingEnabled;
    document.getElementById('boldHeadingButton').textContent = boldHeadingEnabled
        ? 'Disable Bold Aircraft'
        : 'Enable Bold Aircraft';

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

    // Re-render the table without any filters
    renderFlightsTable(allFlights);
});

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

// Manual update ATIS and Controllers
document.getElementById('manualUpdateButton').addEventListener('click', async () => {
    const icao = document.getElementById('icao').value.trim().toUpperCase();
    if (!icao) {
        alert('Please enter a valid ICAO code.');
        return;
    }

    try {
        // Fetch ATIS and controllers manually
        await fetchAirportATIS(icao);
        await fetchControllers(icao);
    } catch (error) {
        console.error('Error during manual update:', error.message);
        alert('Failed to update ATIS and Controllers. Check console for details.');
    }
});

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
    let countdown = 15; // Update countdown for 15 seconds
    const countdownTimer = document.getElementById('countdownTimer');

    // Set interval for 15 seconds
    updateInterval = setInterval(async () => {
        await fetchAndUpdateFlights(icao);
        await fetchControllers(icao); // Update controllers on auto-update
        await fetchActiveATCAirports(); // Update active airports dynamically
        countdown = 15; // Reset countdown
    }, 15000); // 15 seconds interval 

    // Countdown display logic (decrements every second)
    countdownInterval = setInterval(() => {
        countdown--;
        countdownTimer.textContent = `${countdown}`;
        if (countdown <= 0) countdown = 15; // Reset countdown if it reaches 0
    }, 1000); // 1 second interval for countdown display

    // Auto-stop the update after 15 minutes
    updateTimeout = setTimeout(() => {
        stopAutoUpdate();
        alert('Auto-update stopped after 15 minutes.');
    }, 15 * 60 * 1000); // 15 minutes

    document.getElementById('stopUpdateButton').style.display = 'inline';
    countdownTimer.style.display = 'inline';
});
    document.getElementById('stopUpdateButton').addEventListener('click', stopAutoUpdate);
});