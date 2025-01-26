// ============================
// Constants and Global State
// ============================

const PROXY_URL = 'https://infiniteflightapi.deno.dev/';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8';

let allFlights = [];
let headingFilterActive = false;
let boldedHeadings = { minHeading: null, maxHeading: null };
let hiddenDistance = { minDistance: null, maxDistance: null };
let distanceFilterActive = false;
let minDistance = null;
let maxDistance = null;
let updateInterval = null;
let updateTimeout = null;
let countdownInterval = null;
let hideOtherAircraft = false;
let boldHeadingEnabled = false;
let applyDistanceFilterEnabled = false;
let isAutoUpdateActive = false;

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
    // Load and apply default headings
    const defaultMinHeading = parseFloat(getCookie('defaultMinHeading'));
    const defaultMaxHeading = parseFloat(getCookie('defaultMaxHeading'));

    if (!isNaN(defaultMinHeading) && !isNaN(defaultMaxHeading)) {
        document.getElementById('minHeading').value = defaultMinHeading;
        document.getElementById('maxHeading').value = defaultMaxHeading;
        boldHeadingEnabled = true;
        boldedHeadings.minHeading = defaultMinHeading;
        boldedHeadings.maxHeading = defaultMaxHeading;
    }

    // Load and apply default distances
    const defaultMinDistance = parseFloat(getCookie('defaultMinDistance'));
    const defaultMaxDistance = parseFloat(getCookie('defaultMaxDistance'));

    if (!isNaN(defaultMinDistance) && !isNaN(defaultMaxDistance)) {
        document.getElementById('minDistance').value = defaultMinDistance;
        document.getElementById('maxDistance').value = defaultMaxDistance;
        applyDistanceFilterEnabled = true;
        hiddenDistance.minDistance = defaultMinDistance;
        hiddenDistance.maxDistance = defaultMaxDistance;
    }

    renderFlightsTable(allFlights);
}

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

});

// ============================
// Fetch Functions
// ============================

async function fetchWithProxy(endpoint) {
    try {
        const response = await fetch(`${PROXY_URL}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error from proxy:', errorData);
            throw new Error(`Error fetching data: ${response.status}`);
        }

        const textResponse = await response.text();
        try {
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

// ============================
// Refactor Fetch Logic
// ============================

let atcDataCache = null;
let atcDataFetchPromise = null;

/**
 * Fetch ATC data once and cache it
 */
async function fetchATCData() {
    console.log("Starting fetchATCData...");

    // Return cached data if available
    if (atcDataCache) {
        console.log("Returning cached ATC data:", atcDataCache);
        return atcDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (atcDataFetchPromise) {
        console.log("Returning ongoing fetch promise...");
        return atcDataFetchPromise;
    }

    // Start the fetch process
    console.log("Fetching ATC data...");
    atcDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/atc`)
        .then((data) => {
            console.log("Raw data received:", data);

            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid ATC data received:", data);
                throw new Error("Invalid ATC data format.");
            }

            // Cache the result
            atcDataCache = data.result;
            console.log("Caching ATC data:", atcDataCache);
            return atcDataCache;
        })
        .catch((error) => {
            console.error("Error fetching ATC data:", error.message);

            // Clear cache on error
            atcDataCache = null;
            atcDataFetchPromise = null;
            throw error;
        });

    // Return the fetch promise
    return atcDataFetchPromise;
}


function clearATCDataCache() {
    atcDataCache = null;
    atcDataFetchPromise = null;
}


let flightDataCache = null;
let flightDataFetchPromise = null;

/**
 * Fetch flight data once and cache it
 */
async function fetchFlightData() {
    console.log("Starting fetchFlightData...");

    // Return cached data if available
    if (flightDataCache) {
        return flightDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (flightDataFetchPromise) {
        console.log("Returning ongoing fetch promise...");
        return flightDataFetchPromise;
    }

    // Start the fetch process
    console.log("Fetching flight data...");
    flightDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/flight`)
        .then((data) => {
            console.log("Raw data received:", data);

            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid flight data received:", data);
                throw new Error("Invalid flight data format.");
            }

            // Cache the result
            flightDataCache = data.result;
            console.log("Caching flight data:", flightDataCache);
            return flightDataCache;
        })
        .catch((error) => {
            console.error("Error fetching flight data:", error.message);

            // Clear cache on error
            flightDataCache = null;
            flightDataFetchPromise = null;
            throw error;
        });

    // Return the fetch promise
    return flightDataFetchPromise;
}

function clearFlightDataCache() {
    flightDataCache = null;
    flightDataFetchPromise = null;
}


let statusDataCache = null;
let statusDataFetchPromise = null;

/**
 * Fetch status data once and cache it
 */
async function fetchStatusData() {
    console.log("Starting fetchStatusData...");

    // Return cached data if available
    if (statusDataCache) {
        return statusDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (statusDataFetchPromise) {
        console.log("Returning ongoing fetch promise...");
        return statusDataFetchPromise;
    }

    // Start the fetch process
    console.log("Fetching status data...");
    statusDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`)
        .then((data) => {
            console.log("Raw data received:", data);

            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid status data received:", data);
                throw new Error("Invalid status data format.");
            }

            // Cache the result
            statusDataCache = data.result;
            console.log("Caching status data:", statusDataCache);
            return statusDataCache;
        })
        .catch((error) => {
            console.error("Error fetching status data:", error.message);

            // Clear cache on error
            statusDataCache = null;
            statusDataFetchPromise = null;
            throw error;
        });

    // Return the fetch promise
    return statusDataFetchPromise;
}

function clearStatusDataCache() {
    statusDataCache = null;
    statusDataFetchPromise = null;
}

// ============================
// async functions
// ============================


async function fetchActiveATCAirports() {
    try {
        const atcData = await fetchATCData(); // atcData is already the result array

        // Map airports to their facilities
        const activeATCAirports = (atcData || []).reduce((acc, atcFacility) => {
            const airportIcao = atcFacility.airportIcao;

            if (!acc[airportIcao]) {
                acc[airportIcao] = {
                    icao: airportIcao,
                    hasApproach: false,
                };
            }

            // Check if this facility is "Approach" (type 4)
            if (atcFacility.type === 4) {
                acc[airportIcao].hasApproach = true;
            }

            return acc;
        }, {});

        // Fetch inbound counts for airports
        const worldData = await fetchWithProxy(`/sessions/${SESSION_ID}/world`);
        const airportsWithInbounds = (worldData.result || []).filter(
            (airport) => airport.inboundFlightsCount > 0
        );

        // Combine active ATC data with inbound flight data
        const combinedAirports = airportsWithInbounds.map((airport) => {
            const atcInfo = activeATCAirports[airport.airportIcao] || { hasApproach: false };
            return {
                icao: airport.airportIcao,
                inboundCount: airport.inboundFlightsCount,
                hasApproach: atcInfo.hasApproach,
                hasATC: Boolean(activeATCAirports[airport.airportIcao]),
            };
        });

        // Sort by inbound count in descending order
        combinedAirports.sort((a, b) => b.inboundCount - a.inboundCount);

        // Select the top 5 airports by inbound flights
        const topAirports = combinedAirports.slice(0, 4);

        // Format the output
        const formattedAirports = topAirports.map((airport) => {
            let icao = airport.icao;

            // Add bold for airports with ATC
            if (airport.hasATC) {
                icao = `<strong>${icao}</strong>`;
            }

            // Add an asterisk for airports with approach
            if (airport.hasApproach) {
                icao += "*";
            }

            return `${icao}: ${airport.inboundCount}`;
        });

        // Join the output with commas
        const formattedOutput = formattedAirports.join(", ");

        // Update the DOM
        const atcAirportsListElement = document.getElementById("atcAirportsList");
        atcAirportsListElement.innerHTML = formattedOutput || "No active ATC airports found.";
    } catch (error) {
        console.error("Error fetching active ATC airports:", error.message);

        // Display error message
        const atcAirportsListElement = document.getElementById("atcAirportsList");
        atcAirportsListElement.textContent = "Failed to fetch active ATC airports.";
    }
}

// Fetch airport latitude and longitude
async function fetchAirportCoordinates(icao) {
    const cached = getCache(icao, 'airportCoordinates', cacheExpiration.airportCoordinates);
    if (cached) {
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
        stopAutoUpdate();
        return [];
    }
}



// Fetch ATIS
async function fetchAirportATIS(icao) {
    const atisElement = document.getElementById('atisMessage');
    if (atisElement) atisElement.textContent = 'Fetching ATIS...';

    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) {
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
                    6: "Center", // Center frequency
                    7: "ATIS",
                };
                const frequencyName = frequencyTypes[facility.type] || "Unknown";
                return { frequencyName, username: facility.username, type: facility.type };
            });

        // Sort controllers by a specific order
        const sortedControllers = controllers.sort((a, b) => {
            const order = ["ATIS", "Clearance", "Ground", "Tower", "Approach", "Departure", "Center", "Unknown"];
            const indexA = order.indexOf(a.frequencyName);
            const indexB = order.indexOf(b.frequencyName);
            return indexA - indexB;
        }).map(ctrl => `${ctrl.frequencyName}: ${ctrl.username}`);

        // Extract only Center frequencies
        const centerFrequencies = controllers
            .filter(ctrl => ctrl.frequencyName === "Center")
            .map(ctrl => `${ctrl.frequencyName}: ${ctrl.username}`);

        setCache(icao, sortedControllers, 'controllers');
        displayControllers(sortedControllers, centerFrequencies); // Pass both sorted controllers and centers
        return sortedControllers;
    } catch (error) {
        console.error('Error fetching controllers:', error.message);
        displayControllers(['No active controllers available'], []);
        return [];
    }
}

// ============================
// Update distances, ETA, and headings
// ============================

async function updateDistancesAndETAs(flights, airportCoordinates) {
    for (const flight of flights) {
        try {
            if (
                !airportCoordinates ||
                !flight.latitude ||
                !flight.longitude ||
                !flight.speed ||
                flight.speed <= 0
            ) {
                flight.distanceToDestination = 'N/A';
                flight.etaMinutes = 'N/A';
                flight.headingFromAirport = 'N/A';
                continue;
            }

            flight.distanceToDestination = Math.ceil(
                calculateDistance(
                    flight.latitude,
                    flight.longitude,
                    airportCoordinates.latitude,
                    airportCoordinates.longitude
                )
            );

            flight.etaMinutes = calculateETA(
                flight.latitude,
                flight.longitude,
                airportCoordinates.latitude,
                airportCoordinates.longitude,
                flight.speed,
                flight.heading
            );

            flight.headingFromAirport = calculateBearing(
                airportCoordinates.latitude,
                airportCoordinates.longitude,
                flight.latitude,
                flight.longitude
            );
        } catch (error) {
            console.error(`Error updating flight ${flight.callsign || 'Unknown'}:`, error.message);
            flight.distanceToDestination = 'N/A';
            flight.etaMinutes = 'N/A';
            flight.headingFromAirport = 'N/A';
        }
    }
}

// Helper functions with validations

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Validate coordinates
    if (
        lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
    ) {
        throw new Error("Invalid coordinates provided for distance calculation.");
    }

    const R = 3440; // Earth's radius in nautical miles
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1), Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    // Validate coordinates
    if (
        lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
    ) {
        throw new Error("Invalid coordinates provided for bearing calculation.");
    }

    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const toDegrees = (radians) => radians * (180 / Math.PI);

    const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
    const Δλ = toRadians(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return (toDegrees(Math.atan2(y, x)) + 360) % 360; // Normalize to 0–360
}

function calculateETA(currentLat, currentLon, destLat, destLon, groundSpeed, heading) {
    // Validate inputs
    if (
        !groundSpeed || groundSpeed <= 0 ||
        currentLat == null || currentLon == null || destLat == null || destLon == null ||
        isNaN(currentLat) || isNaN(currentLon) || isNaN(destLat) || isNaN(destLon)
    ) {
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

// ============================
// Fetch and update flights
// ============================

async function fetchAndUpdateFlights(icao) {
    try {
        // Ensure the main airport section is visible
        document.querySelector('.mainAirport').style.display = 'block';
        document.getElementById('atisMessage').style.display = 'block';
        document.getElementById('controllersList').style.display = 'block';

        // Fetch ATIS and Controllers
        const atis = await fetchAirportATIS(icao, 'atisMessage');
        const controllers = await fetchControllers(icao, 'controllersList');

        // Display ATIS and Controllers
        displayATIS(atis);
        displayControllers(controllers);

        // Fetch flights and update the table
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        if (!inboundFlightIds.length) {
            console.warn("No inbound flights found for ICAO:", icao);
            allFlights = [];
            renderFlightsTable(allFlights);
            return;
        }

        const flights = await fetchInboundFlightDetails(inboundFlightIds);
        const airportCoordinates = await fetchAirportCoordinates(icao);

        if (!airportCoordinates) {
            console.warn("No coordinates found for airport ICAO:", icao);
            throw new Error("Failed to fetch airport coordinates.");
        }

        await updateDistancesAndETAs(flights, airportCoordinates);
        allFlights = flights;
        renderFlightsTable(allFlights);
    } catch (error) {
        console.error("Error fetching flights or controllers:", error.message);
        allFlights = [];
        renderFlightsTable(allFlights);
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

// ============================
// Secondary Airport Functions
// ============================

// Fetch ATIS for secondary airports using shared cache
async function fetchSecondaryATIS(icao) {
    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) {
        return cached;
    }

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/atis`);
        const atis = data.result || 'ATIS not available';
        setCache(icao, atis, 'atis'); // Store ATIS in the shared cache
        return atis;
    } catch (error) {
        console.error(`Error fetching ATIS for secondary airport ${icao}:`, error.message);
        return 'ATIS not available';
    }
}

// Fetch controllers for secondary airports using shared cache
async function fetchSecondaryControllers(icao) {
    const cached = getCache(icao, 'controllers', cacheExpiration.controllers);
    if (cached) {
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
                };
                const frequencyName = frequencyTypes[facility.type] || "Unknown";
                return `${frequencyName}: ${facility.username}`;
            });
        setCache(icao, controllers, 'controllers'); // Store controllers in the shared cache
        return controllers;
    } catch (error) {
        console.error(`Error fetching controllers for secondary airport ${icao}:`, error.message);
        return [];
    }
}
 
// Add secondary airport to the display
document.getElementById('add').addEventListener('click', async (event) => {
    event.preventDefault();
    const secondaryIcao = document.getElementById('icao').value.trim().toUpperCase();

    if (!secondaryIcao) {
        alert('Please enter a valid ICAO code.');
        return;
    }

    // Prevent duplicate secondary airports
    if (document.getElementById(`secondary-${secondaryIcao}`)) {
        alert('This airport is already added.');
        return;
    }

    try {
        // Create container for the secondary airport
        const secondaryAirportContainer = document.getElementById('secondaryAirportContainer');
        const airportDiv = document.createElement('div');
        airportDiv.id = `secondary-${secondaryIcao}`;
        airportDiv.className = 'secondaryAirport';
        airportDiv.innerHTML = `
            <p><strong>${secondaryIcao}</strong></p>
            <p class="secondary-atis" id="secondary-${secondaryIcao}-atis">Fetching ATIS...</p>
            <p class="secondary-controllers" id="secondary-${secondaryIcao}-controllers">Fetching controllers...</p>
            <button type="button" class="removeAirportButton" data-icao="${secondaryIcao}">Remove</button>
        `;
        secondaryAirportContainer.appendChild(airportDiv);

        // Fetch ATIS and controllers for the secondary airport
        const atis = await fetchSecondaryATIS(secondaryIcao);
        const controllers = await fetchSecondaryControllers(secondaryIcao);

        // Display ATIS
        const atisElement = document.getElementById(`secondary-${secondaryIcao}-atis`);
        atisElement.textContent = `ATIS: ${atis || 'Not available'}`;

        // Display controllers
        const controllersElement = document.getElementById(`secondary-${secondaryIcao}-controllers`);
        controllersElement.innerHTML = controllers.length
            ? controllers.map(ctrl => `${ctrl}<br>`).join('') // Use <br> for line breaks
            : 'No active controllers available.';
    } catch (error) {
        console.error(`Error fetching data for secondary airport ${secondaryIcao}:`, error.message);
        alert(`Failed to fetch data for the secondary airport: ${secondaryIcao}`);
    }
});

// Remove secondary airport functionality
document.getElementById('secondaryAirportContainer').addEventListener('click', (event) => {
    if (event.target.classList.contains('removeAirportButton')) {
        const icao = event.target.getAttribute('data-icao');
        const airportDiv = document.getElementById(`secondary-${icao}`);
        if (airportDiv) {
            airportDiv.remove();
        }
    }
});

// Display ATIS
function displayATIS(atis) {
    const atisElement = document.getElementById('atisMessage');
    const mainAirportElement = document.querySelector('.mainAirport');

    if (!atisElement || !mainAirportElement) {
        console.error('ATIS display element or mainAirport element not found.');
        return;
    }

    // Ensure the main airport section is visible
    mainAirportElement.style.display = 'block';

    // Update the ATIS content
    atisElement.style.display = 'block';
    atisElement.textContent = `ATIS: ${atis || 'Not available'}`;
}

function displayControllers(controllers, centerFrequencies = []) {
    const controllersElement = document.getElementById('controllersList');
    const mainAirportElement = document.querySelector('.mainAirport');

    if (!controllersElement || !mainAirportElement) {
        console.error('Controllers display element or mainAirport element not found.');
        return;
    }

    // Ensure the main airport section is visible
    mainAirportElement.style.display = 'block';

    // Separate Center frequencies and other controllers
    const otherControllers = controllers.length
        ? controllers.filter(ctrl => !centerFrequencies.includes(ctrl)).map(ctrl => `${ctrl}<br>`).join('')
        : 'No active controllers available.';

    const centerControllers = centerFrequencies.length
        ? centerFrequencies.map(ctrl => `${ctrl}<br>`).join('')
        : 'No active Center frequencies available.';

    // Combine other controllers first, followed by Center frequencies
    controllersElement.style.display = 'block';
    controllersElement.innerHTML = `
        <p>${otherControllers}</p>
        <p>${centerControllers}</p>
    `;
}

// ============================
// Highlights
// ============================

let headingHighlightEnabled = false;

// Clear all highlights
function clearHighlights() {
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    rows.forEach(row => {
        row.style.backgroundColor = ''; // Reset background color
    });
}

function highlightCloseETAs() {
    clearHighlights();
    
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    if (!rows.length) return; // Exit if no rows exist

    // Determine groups: All flights if no filter, or split into bold/non-bold based on heading
    let boldGroup = allFlights;
    let nonBoldGroup = [];

    if (headingHighlightEnabled) {
        const minHeading = parseFloat(document.getElementById('minHeading').value);
        const maxHeading = parseFloat(document.getElementById('maxHeading').value);

        if (isNaN(minHeading) || isNaN(maxHeading) || minHeading > maxHeading) {
            alert('Please enter valid Min Heading and Max Heading values.');
            return;
        }

        // Split flights into bold and non-bold groups based on heading
        boldGroup = allFlights.filter(flight =>
            flight.headingFromAirport >= minHeading && flight.headingFromAirport <= maxHeading
        );

        nonBoldGroup = allFlights.filter(flight =>
            flight.headingFromAirport < minHeading || flight.headingFromAirport > maxHeading
        );
    }

    // Sort all flights by ETA before highlighting
    allFlights.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

    // Highlight the two groups separately
    highlightGroup(boldGroup, rows, '#fffa9f'); // Yellow for bold group
    highlightGroup(nonBoldGroup, rows, '#80daeb'); // Blue for non-bold group
}

// Highlight a specific group of flights
function highlightGroup(group, rows, baseColor) {
    group.forEach((flight, index) => {
        const currentRow = rows[allFlights.indexOf(flight)];

        // Skip if the row is hidden
        const isHidden = currentRow.style.display === 'none' || 
                         window.getComputedStyle(currentRow).display === 'none';
        if (isHidden) {
            return;
        }

        // Validate ETA string
        function isValidETA(eta) {
            if (eta === 'N/A' || !eta || eta.startsWith('>')) return false; // Invalid
            const [minutes, seconds] = eta.split(':').map(Number);
            return !(isNaN(minutes) || isNaN(seconds)); // Valid
        }

        // Skip invalid ETAs
        if (!isValidETA(flight.etaMinutes)) {
            currentRow.style.display = 'none'; // Hide invalid rows
            return;
        }

        let closestTimeDiff = Number.MAX_SAFE_INTEGER;
        let highlightColor = null;

        // Compare with the next flight in the group
        if (index + 1 < group.length) {
            const nextFlight = group[index + 1];
            const timeDiff = Math.abs(parseETAInSeconds(flight.etaMinutes) - parseETAInSeconds(nextFlight.etaMinutes));
            const color = getHighlightColor(timeDiff);

            if (color) {
                closestTimeDiff = Math.min(closestTimeDiff, timeDiff);
                highlightColor = getHigherPriorityColor(highlightColor, color);
            }
        }

        // Compare with the previous flight in the group
        if (index > 0) {
            const prevFlight = group[index - 1];
            const timeDiff = Math.abs(parseETAInSeconds(flight.etaMinutes) - parseETAInSeconds(prevFlight.etaMinutes));
            const color = getHighlightColor(timeDiff);

            if (color) {
                closestTimeDiff = Math.min(closestTimeDiff, timeDiff);
                highlightColor = getHigherPriorityColor(highlightColor, color);
            }
        }

        // Update row highlights
        const etaCell = currentRow.querySelector('td:nth-child(5)');
        if (etaCell && flight.etaMinutes !== 'N/A') {
            etaCell.innerHTML = `${flight.distanceToDestination}nm<br>${flight.etaMinutes}`; // Show NM and MM:SS
        }

        if (highlightColor) {
            applyHighlight(currentRow, highlightColor);
        }
    });
}

// Determine the highlight color based on the time difference
function getHighlightColor(timeDiff) {
    if (timeDiff > 120) return null; // No highlight for > 120 seconds
    if (timeDiff <= 10) return '#fffa9f'; // Yellow
    if (timeDiff <= 30) return '#80daeb'; // Blue
    if (timeDiff <= 60) return '#daceca'; // Beige
    if (timeDiff <= 120) return '#eaeaea'; // Gray
    return null; // No highlight
}

// Compare and return the higher-priority color
function getHigherPriorityColor(color1, color2) {
    const colorPriority = ['#fffa9f', '#80daeb', '#daceca', '#eaeaea']; // Define priority order
    const index1 = colorPriority.indexOf(color1);
    const index2 = colorPriority.indexOf(color2);

    if (index1 === -1) return color2; // If color1 has no priority, use color2
    if (index2 === -1) return color1; // If color2 has no priority, use color1
    return index1 < index2 ? color1 : color2; // Return the higher-priority color
}

// Apply highlights to a row
function applyHighlight(row, color) {
    const currentColor = rgbToHex(row.style.backgroundColor); // Convert current color to hex

    // Apply the new color only if it has higher priority
    if (!currentColor || getHigherPriorityColor(color, currentColor) === color) {
        row.style.backgroundColor = color;
    }
}

// Utility function to convert RGB color to HEX
function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return null; // Handle unset or transparent colors

    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return null;

    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
}

// Toggle Heading Highlight and reapply highlights
document.getElementById('filterHeadingHighlightButton').addEventListener('click', () => {
    const minHeadingInput = document.getElementById('minHeading').value;
    const maxHeadingInput = document.getElementById('maxHeading').value;

    const minHeading = parseFloat(minHeadingInput);
    const maxHeading = parseFloat(maxHeadingInput);

    if (isNaN(minHeading) || isNaN(maxHeading) || minHeading > maxHeading) {
        alert('Please enter valid Min Heading and Max Heading values.');
        return;
    }

    // Save minHeading and maxHeading as defaults
    setCookie('defaultMinHeading', minHeading, 30);
    setCookie('defaultMaxHeading', maxHeading, 30);

    headingHighlightEnabled = !headingHighlightEnabled;

    const button = document.getElementById('filterHeadingHighlightButton');
    button.textContent = headingHighlightEnabled ? 'Disable' : 'Split';
    button.style.backgroundColor = headingHighlightEnabled ? 'blue' : '#c2c2c2';

    highlightCloseETAs(); // Reapply highlighting with the heading filter
});

// ============================
// Toggle Heading Button Functionality
// ============================

// Modify the toggleHeadingButton click listener
document.getElementById('toggleHeadingButton').addEventListener('click', () => {
    hideOtherAircraft = !hideOtherAircraft;

    document.getElementById('toggleHeadingButton').textContent = hideOtherAircraft
        ? 'Disable'
        : 'Hide';

    boldHeadingButton.style.backgroundColor = boldHeadingEnabled ? 'blue' : '#c2c2c2';

    // Re-render the table with the hideFilter flag
    renderFlightsTable(allFlights, hideOtherAircraft);
});

// ============================
// Bold Heading Button Functionality
// ============================

document.getElementById('boldHeadingButton').addEventListener('click', () => {
    const minHeading = parseFloat(document.getElementById('minHeading').value);
    const maxHeading = parseFloat(document.getElementById('maxHeading').value);

    if (isNaN(minHeading) || isNaN(maxHeading) || minHeading > maxHeading) {
        alert('Please enter valid Min and Max Heading values.');
        return;
    }

    // Toggle boldHeadingEnabled and update button text
    boldHeadingEnabled = !boldHeadingEnabled;
    document.getElementById('boldHeadingButton').textContent = boldHeadingEnabled
        ? 'Disable'
        : 'Enable';
        
boldHeadingButton.style.backgroundColor = boldHeadingEnabled ? 'blue' : '#c2c2c2';

    // Update boldedHeadings range
    boldedHeadings.minHeading = minHeading;
    boldedHeadings.maxHeading = maxHeading;

    // Re-render the table
    renderFlightsTable(allFlights);
});

// ============================
// Toggle Apply Distance Filter
// ============================

// Apply Distance Filter
document.getElementById('applyDistanceFilterButton').addEventListener('click', () => {
    const minDistanceInput = document.getElementById('minDistance').value;
    const maxDistanceInput = document.getElementById('maxDistance').value;

    const minDistance = parseFloat(minDistanceInput);
    const maxDistance = parseFloat(maxDistanceInput);

    if (isNaN(minDistance) || isNaN(maxDistance) || minDistance > maxDistance) {
        alert('Please enter valid Min Distance and Max Distance values.');
        return;
    }

    // Save minDistance and maxDistance as defaults
    setCookie('defaultMinDistance', minDistance, 30);
    setCookie('defaultMaxDistance', maxDistance, 30);

    applyDistanceFilterEnabled = !applyDistanceFilterEnabled;

    const button = document.getElementById('applyDistanceFilterButton');
    button.textContent = applyDistanceFilterEnabled ? 'Disable' : 'Enable';
    button.style.backgroundColor = applyDistanceFilterEnabled ? 'blue' : '#c2c2c2';

    hiddenDistance.minDistance = minDistance;
    hiddenDistance.maxDistance = maxDistance;

    renderFlightsTable(allFlights);
});

// Reset Distance Filter
document.getElementById('resetDistanceFilterButton').addEventListener('click', () => {
    minDistance = null;
    maxDistance = null;

    document.getElementById('minDistance').value = '';
    document.getElementById('maxDistance').value = '';

    // Disable the distance filter
    applyDistanceFilterEnabled = false;
    document.getElementById('applyDistanceFilterButton').textContent = 'Enable';

    // Re-render the table without any filters
    renderFlightsTable(allFlights);
});

// ============================
// Helper Function: Update row visibility and styling
// ============================

function updateRowVisibility(row, flight) {
    const isWithinHeadingRange =
        boldedHeadings.minHeading !== null &&
        boldedHeadings.maxHeading !== null &&
        flight.headingFromAirport >= boldedHeadings.minHeading &&
        flight.headingFromAirport <= boldedHeadings.maxHeading;

    const isWithinDistanceRange =
        (hiddenDistance.minDistance === null || flight.distanceToDestination >= hiddenDistance.minDistance) &&
        (hiddenDistance.maxDistance === null || flight.distanceToDestination <= hiddenDistance.maxDistance);

    if (applyDistanceFilterEnabled) {
        row.style.display = isWithinDistanceRange ? "" : "none";
    } else {
        row.style.display = "";
    }

    row.style.fontWeight = (boldHeadingEnabled && isWithinHeadingRange) ? "bold" : "";
} 

function getHeadingArrow(heading) {
    if (typeof heading !== "number") return ""; // Return empty if heading is not valid

    const directions = [
        "is-north",      // 0° (North)
        "is-northeast",  // 45° (Northeast)
        "is-east",       // 90° (East)
        "is-southeast",  // 135° (Southeast)
        "is-south",      // 180° (South)
        "is-southwest",  // 225° (Southwest)
        "is-west",       // 270° (West)
        "is-northwest",  // 315° (Northwest)
    ];

    const index = Math.round(heading / 45) % 8; // Determine direction index
    return `<span class="arrow ${directions[index]}"></span>`; // Add arrow class
}

// ============================
// ATC Table Rendering
// ============================

// Helper function to map frequency type codes to descriptive names
// Map frequency type to short codes
function mapFrequencyType(type) {
    const frequencyMap = {
        0: "G", // Ground
        1: "T", // Tower
        2: "U", // Unicom
        3: "C", // Clearance
        4: "A", // Approach
        5: "D", // Departure
        6: "C", // Center
        7: "S", // ATIS
    };
    return frequencyMap[type] || null;
}

// Fetch and process active ATC data
async function fetchActiveATCAirportsData() {
    try {
        const atcData = await fetchATCData();

        // Validate the ATC data
        if (!Array.isArray(atcData)) {
            console.error("Invalid ATC data received:", atcData);
            throw new Error("Invalid ATC data format.");
        }

        console.log("Valid ATC data:", atcData);

        // Define fixed frequency order
        const frequencyOrder = ["G", "T", "A", "D", "S"];

        // Group ATC data by airport and aggregate frequencies
        const airports = atcData.reduce((acc, facility) => {
            const icao = facility.airportName; // ICAO code of the airport
            const frequencyCode = mapFrequencyType(facility.type); // Frequency type

            // Skip entries without a valid airport name
            if (!icao) return acc;

            // Initialize airport entry if it doesn't exist
            if (!acc[icao]) {
                acc[icao] = { icao, frequencies: [] };
            }

            // Add frequency code if valid
            if (frequencyCode) acc[icao].frequencies.push(frequencyCode);

            return acc;
        }, {});

        // Process and sort frequencies for each airport
        const processedAirports = Object.values(airports).map((airport) => {
            airport.frequencies = frequencyOrder
                .filter((freq) => airport.frequencies.includes(freq)) // Retain valid frequencies
                .join(""); // Concatenate sorted frequencies
            return airport;
        });

        console.log("Processed ATC data:", processedAirports);

        // Return the processed airports
        return processedAirports;
    } catch (error) {
        console.error("Error in fetchActiveATCAirportsData:", error.message);
        return [];
    }
}

function countInboundFlightsByDistance(flights) {
    if (!Array.isArray(flights)) {
        console.error("countInboundFlightsByDistance received invalid input:", flights);
        return { "50nm": 0, "200nm": 0, "500nm": 0 };
    }

    const counts = { "50nm": 0, "200nm": 0, "500nm": 0 };
    flights.forEach((flight) => {
        const distance = flight.distanceToDestination;
        if (typeof distance !== "number") return;

        if (distance >= 0 && distance <= 50) counts["50nm"]++;
        else if (distance >= 51 && distance <= 200) counts["200nm"]++;
        else if (distance >= 201 && distance <= 500) counts["500nm"]++;
    });

    return counts;
}

async function renderATCTable() {
    const atcTableBody = document.querySelector("#atcTable tbody");

    if (!atcTableBody) {
        console.error("ATC table body not found in DOM.");
        return;
    }

    try {
        const activeATCAirports = await fetchActiveATCAirportsData();

        if (!activeATCAirports || activeATCAirports.length === 0) {
            console.warn("No active ATC airports to display.");
            atcTableBody.innerHTML = '<tr><td colspan="6">No active ATC airports available.</td></tr>';
            return;
        }

        // Collect data for each airport, including total inbound flights
        const airportData = [];

        for (const airport of activeATCAirports) {
            const inboundFlightIds = await fetchInboundFlightIds(airport.icao);

            if (!inboundFlightIds || inboundFlightIds.length === 0) {
                console.warn(`No inbound flights found for airport ${airport.icao}.`);
                continue;
            }

            // Fetch flight details and calculate distances
            const airportFlights = await fetchInboundFlightDetails(inboundFlightIds);

            const airportCoordinates = await fetchAirportCoordinates(airport.icao);
            if (!airportCoordinates) {
                console.warn(`No coordinates found for airport ${airport.icao}.`);
                continue;
            }

            await updateDistancesAndETAs(airportFlights, airportCoordinates);

            // Count flights based on distance ranges
            const distanceCounts = countInboundFlightsByDistance(airportFlights);

            // Total number of inbound flights for the airport
            const totalInbounds = airportFlights.length;

            // Store airport data with total inbound flights
            airportData.push({
                icao: airport.icao,
                frequencies: airport.frequencies || "N/A",
                distanceCounts,
                totalInbounds,
            });
        }

        // Sort the airports by total inbound flights (descending order)
        airportData.sort((a, b) => b.totalInbounds - a.totalInbounds);

        // Update rows dynamically
        airportData.forEach((airport) => {
            // Check if a row for this airport already exists
            const existingRow = document.querySelector(`#atcTable tbody tr[data-icao="${airport.icao}"]`);

            if (existingRow) {
                // Update the existing row's cells
                const cells = existingRow.children;
                cells[1].textContent = airport.frequencies;
                cells[2].textContent = airport.distanceCounts["50nm"] || 0;
                cells[3].textContent = airport.distanceCounts["200nm"] || 0;
                cells[4].textContent = airport.distanceCounts["500nm"] || 0;
                cells[5].textContent = airport.totalInbounds || 0;
            } else {
                // Create a new row if it doesn't exist
                const row = document.createElement("tr");
                row.setAttribute("data-icao", airport.icao);
                row.innerHTML = `
                    <td>${airport.icao}</td>
                    <td>${airport.frequencies}</td>
                    <td>${airport.distanceCounts["50nm"] || 0}</td>
                    <td>${airport.distanceCounts["200nm"] || 0}</td>
                    <td>${airport.distanceCounts["500nm"] || 0}</td>
                    <td>${airport.totalInbounds || 0}</td>
                `;
                atcTableBody.appendChild(row);
            }
        });

    } catch (error) {
        console.error("Error in renderATCTable:", error.message);
        atcTableBody.innerHTML = '<tr><td colspan="6">Error loading ATC data. Check console for details.</td></tr>';
    }
}

// ============================
// Table Rendering
// ============================

// Update renderFlightsTable to handle row styling for hidden aircraft
async function renderFlightsTable(allFlights, hideFilter = false) {
    const tableBody = document.querySelector("#flightsTable tbody");
    if (!tableBody) {
        console.error("Flights table body not found in DOM.");
        return;
    }

    tableBody.innerHTML = "";

    if (!Array.isArray(allFlights) || allFlights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No inbound flights found.</td></tr>';
        return;
    }

    try {
        const aircraftIds = allFlights.map(flight => flight.aircraftId);
        const aircraftMachDetails = await pairAircraftData(aircraftIds);

        allFlights.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

        allFlights.forEach((flight) => {
            const row = document.createElement("tr");
            
            const isWithinDistanceRange = (minDistance === null && maxDistance === null) || (
            typeof flight.distanceToDestination === 'number' &&
            flight.distanceToDestination >= (minDistance ?? 0) &&
            flight.distanceToDestination <= (maxDistance ?? Infinity)
        );
            
            const isVisible = isWithinDistanceRange;

        row.style.display = isVisible ? '' : 'none';
            // Determine if the row represents an "other" aircraft
const isOtherAircraft = !hideFilter || (boldHeadingEnabled &&
    (flight.headingFromAirport < boldedHeadings.minHeading ||
     flight.headingFromAirport > boldedHeadings.maxHeading));
            
            // Apply styles for hidden or visible aircraft
            row.style.opacity = isOtherAircraft && hideFilter ? '0.3' : '1';
            row.style.pointerEvents = isOtherAircraft && hideFilter ? 'none' : 'auto';

            const aircraftName = flight.aircraftName || "UNKN";
            const machDetails = aircraftMachDetails[flight.aircraftId] || { minMach: "N/A", maxMach: "N/A" };
            const minMach = machDetails.minMach !== "N/A" ? machDetails.minMach.toFixed(2) : "N/A";
            const maxMach = machDetails.maxMach !== "N/A" ? machDetails.maxMach.toFixed(2) : "N/A";
            const groundSpeed = flight.speed !== "N/A" ? flight.speed.toFixed(0) : "N/A";
            const machValue = flight.speed !== "N/A" ? (flight.speed / 666.739).toFixed(2) : "N/A";
            const heading = flight.headingFromAirport !== "N/A" ? Math.round(flight.headingFromAirport) : "N/A";
            const altitude = flight.altitude !== "N/A" ? flight.altitude.toFixed(0) : "N/A";
            const distance = flight.distanceToDestination !== "N/A" ? `${flight.distanceToDestination}` : "N/A";
            const eta = flight.etaMinutes !== "N/A" ? `${flight.etaMinutes}` : "N/A";

            row.innerHTML = `
                <td>
                    <strong>${flight.callsign || "N/A"}</strong><br>
                    <small>${aircraftName}</small>
                </td>
                <td>
                    ${minMach}M<br>
                    ${maxMach}M
                </td>
                <td>
                    ${groundSpeed}knts<br>
                    ${machValue}M
                </td>
                <td>
                    ${heading}${getHeadingArrow(flight.headingFromAirport)}<br>
                    ${altitude}ft
                </td>
                <td>
                    ${distance}nm<br>
                    ${eta}
                </td>
            `;

            updateRowVisibility(row, flight);
            tableBody.appendChild(row);
        });

        highlightCloseETAs();
    } catch (error) {
        console.error("Error rendering the flights table:", error.message);
        tableBody.innerHTML = '<tr><td colspan="5">Error populating table. Check console for details.</td></tr>';
    }
}

// ============================
// Reset Distance Filter
// ============================

document.getElementById('resetDistanceFilterButton').addEventListener('click', () => {
    minDistance = null;
    maxDistance = null;

    document.getElementById('minDistance').value = '';
    document.getElementById('maxDistance').value = '';

    // Disable the distance filter
    applyDistanceFilterEnabled = false;
    document.getElementById('applyDistanceFilterButton').textContent = 'Enable Distance Filter';

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
        await fetchAirportATIS(icao);
        await fetchControllers(icao);
    } catch (error) {
        console.error('Error during manual update:', error.message);
        alert('Failed to update ATIS and Controllers. Check console for details.');
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Apply default settings from cookies
    applyDefaults();

    try {
        // Initialize data fetching and rendering
        await fetchActiveATCAirports();
        await renderATCTable();
    } catch (error) {
        console.error('Error initializing ATC table:', error.message);
    }

    // Search form submission logic
    const searchButton = document.getElementById("search");
    const icaoInput = document.getElementById("icao");

    async function handleSearch() {
        const icao = icaoInput.value.trim().toUpperCase(); // Get the value from the input

        if (!icao) {
            alert("Please enter a valid ICAO code.");
            return;
        }

        await fetchAndUpdateFlights(icao); // Fetch and update flights
    }

    if (searchButton) {
        searchButton.addEventListener("click", async () => {
            await handleSearch();
        });
    }

    if (icaoInput) {
        icaoInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await handleSearch();
            }
        });
    }

    // Auto-update functionality
    const updateButton = document.getElementById("update");
    let isAutoUpdateActive = false;
    let updateInterval = null;
    let countdownInterval = null;

    if (updateButton) {
        updateButton.addEventListener("click", () => {
            const icao = icaoInput.value.trim().toUpperCase();
            if (!icao) {
                alert("Please enter a valid ICAO code before updating.");
                return;
            }

            if (isAutoUpdateActive) {
                stopAutoUpdate();
            } else {
                startAutoUpdate(icao);
            }
        });
    }

    function startAutoUpdate(icao) {
        isAutoUpdateActive = true;
        updateButton.style.color = "blue";
        const icon = updateButton.querySelector("i");
        if (icon) icon.classList.add("spin");

        const countdownTimer = document.getElementById("countdownTimer");
        countdownTimer.style.display = "inline";
        let countdown = 5;

        updateInterval = setInterval(async () => {
            await fetchAndUpdateFlights(icao);
            await fetchControllers(icao);
            await fetchActiveATCAirports();
            renderFlightsTable(allFlights, hideOtherAircraft);
            await renderATCTable();
            countdown = 5;
        }, 5000);

        countdownInterval = setInterval(() => {
            countdown--;
            countdownTimer.textContent = `${countdown}`;
            if (countdown <= 0) countdown = 5;
        }, 1000);
    }

    function stopAutoUpdate() {
        isAutoUpdateActive = false;
        updateButton.style.color = "#828282";
        const icon = updateButton.querySelector("i");
        if (icon) icon.classList.remove("spin");
        const countdownTimer = document.getElementById("countdownTimer");

        if (updateInterval) clearInterval(updateInterval);
        if (countdownInterval) clearInterval(countdownInterval);

        countdownTimer.style.display = "none";
    }
});