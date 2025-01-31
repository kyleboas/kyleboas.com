import { fetchStatusData, fetchFlightsData } from "./api.js";
import { getCache, setCache, cacheExpiration } from "./cache.js";
import { pairAircraftData, aircraftMachDetails } from "./aircraft.js";
import { fetchAirportATIS, fetchControllers } from "./ATC.js";
import { displayATIS, displayControllers } from "./display.js";
import { renderFlightsTable, getFlights } from "./flightTable.js";
import { fetchAirportCoordinates } from "./airport.js";
import { stopAutoUpdate, isAutoUpdateActive, lastApiUpdateTime } from "./AutoUpdate.js";

// Fetch inbound flight IDs
async function fetchInboundFlightIds(icao) {
    const cached = getCache(icao, 'inboundFlightIds', cacheExpiration.inboundFlightIds);
    if (cached) {
        return cached;
    }

    try {
        const data = await fetchStatusData();
        const inboundFlights = data.result.inboundFlights || [];
        setCache(icao, inboundFlights, 'inboundFlightIds');
        return inboundFlights;
    } catch (error) {
        console.error('Error fetching inbound flight IDs:', error.message);
        alert('Failed to fetch inbound flight IDs.');
        return [];
    }
}

async function fetchInboundFlightDetails(inboundFlightIds = []) {
    try {
        // Fetch flights data from the proxy API
        const data = await fetchFlightsData();

        // Validate API response
        if (!data || !data.result || !Array.isArray(data.result)) {
            throw new Error("Invalid flight data received from the API.");
        }

        // Filter flights based on the inbound flight IDs
        let flightsFromApi = data.result.filter(flight => inboundFlightIds.includes(flight.flightId));

        // Ensure only unique flight details are returned
        const uniqueFlights = [...new Map(flightsFromApi.map(f => [f.flightId, f])).values()];

        // Map relevant details for each flight
        return uniqueFlights.map(flight => ({
            flightId: flight.flightId,
            callsign: flight.callsign || "N/A",
            aircraftId: flight.aircraftId || "N/A",
            aircraftName: aircraftMachDetails[flight.aircraftId]?.name || "UNKN", // Aircraft name lookup
            latitude: flight.latitude || null,
            longitude: flight.longitude || null,
            altitude: Math.round(flight.altitude) || "N/A",
            speed: Math.round(flight.speed) || "N/A",
            heading: Math.round(flight.heading) || "N/A",
            lastReport: flight.lastReport || "N/A",
            destinationIcao: flight.destinationIcao || "N/A",
            interpolatedPositions: [], // Placeholder for interpolated data
        }));
    } catch (error) {
        console.error("Error fetching flight details:", error.message);
        alert("Failed to fetch flight details.");
        stopAutoUpdate();
        return [];
    }
}

// Vincenty's Formula to predict position 

function predictPosition(lat, lon, groundSpeed, heading, seconds) {
    const a = 6378137.0; // WGS-84 semi-major axis (meters)
    const f = 1 / 298.257223563; // WGS-84 flattening
    const b = (1 - f) * a;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const toDegrees = (radians) => (radians * 180) / Math.PI;

    // Convert ground speed from knots to meters per second
    const speed_mps = (groundSpeed * 1852) / 3600;
    const distance = speed_mps * seconds; // Distance traveled in meters

    const φ1 = toRadians(lat);
    const λ1 = toRadians(lon);
    const α1 = toRadians(heading);

    const sinα1 = Math.sin(α1);
    const cosα1 = Math.cos(α1);
    
    const tanU1 = (1 - f) * Math.tan(φ1);
    const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
    const sinU1 = tanU1 * cosU1;

    let σ1 = Math.atan2(tanU1, cosα1);
    let sinα = cosU1 * sinα1;
    let cos2α = 1 - sinα * sinα;
    let uSq = (cos2α * (a * a - b * b)) / (b * b);
    let A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    let B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

    let σ = distance / (b * A);
    let σP, sinσ, cosσ, Δσ;
    do {
        sinσ = Math.sin(σ);
        cosσ = Math.cos(σ);
        Δσ =
            B *
            sinσ *
            (cos2α +
                (B / 4) *
                    (cosσ * (-1 + 2 * cos2α) -
                        (B / 6) * cos2α * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2α)));
        σP = σ;
        σ = distance / (b * A) + Δσ;
    } while (Math.abs(σ - σP) > 1e-12);

    const tmp = sinU1 * sinσ - cosU1 * cosσ * cosα1;
    const φ2 = Math.atan2(sinU1 * cosσ + cosU1 * sinσ * cosα1, (1 - f) * Math.sqrt(sinα * sinα + tmp * tmp));
    const λ = Math.atan2(
        sinσ * sinα1,
        cosU1 * cosσ - sinU1 * sinσ * cosα1
    );
    const C = (f / 16) * cos2α * (4 + f * (4 - 3 * cos2α));
    const L = λ - (1 - C) * f * sinα * (σ + C * sinσ * (cos2α + C * cosσ * (-1 + 2 * cos2α)));

    const lon2 = (toDegrees(λ1 + L) + 540) % 360 - 180;
    const lat2 = toDegrees(φ2);

    return { latitude: lat2, longitude: lon2 };
}

/**
 * Fill gaps between updates by predicting positions
 */
function fillGapsBetweenUpdates(startLat, startLon, groundSpeed, heading, interval = 18) {
    const positions = [];
    let currentLat = startLat;
    let currentLon = startLon;

    for (let t = 0; t < interval; t++) {
        const newPosition = predictPosition(currentLat, currentLon, groundSpeed, heading, 1); // Step = 1 second
        positions.push({ time: t + 1, latitude: newPosition.latitude, longitude: newPosition.longitude });
        currentLat = newPosition.latitude;
        currentLon = newPosition.longitude;
    }

    return positions;
}

/**
 * Update distances and ETAs for flights
 */
async function updateDistancesAndETAs(flights, airportCoordinates) {
    for (const flight of flights) {
        try {
            if (
                !flight.latitude ||
                !flight.longitude ||
                flight.speed <= 0 ||
                !flight.heading ||
                flight.distanceToDestination === 0
            ) {
                console.warn(`Skipping flight ${flight.callsign || 'Unknown'} due to invalid data.`);
                flight.distanceToDestination = 'N/A';
                flight.etaMinutes = 'N/A';
                flight.headingFromAirport = 'N/A';
                continue; // Skip to the next flight
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

            // Calculate ETA
            flight.etaMinutes = calculateETA(
                flight.latitude,
                flight.longitude,
                airportCoordinates.latitude,
                airportCoordinates.longitude,
                flight.speed,
                flight.heading
            );

            // Calculate heading from airport
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


// Fetch and update flights
async function fetchAndUpdateFlights(icao) {
    // Reset the cache for the new ICAO
    clearStatusDataCache();

    try {
        // Show the main airport section
        const mainAirportElement = document.querySelector('.mainAirport');
        const atisMessageElement = document.getElementById('atisMessage');
        const controllersListElement = document.getElementById('controllersList');

        if (mainAirportElement) mainAirportElement.style.display = 'block';
        if (atisMessageElement) atisMessageElement.style.display = 'block';
        if (controllersListElement) controllersListElement.style.display = 'block';

        // Fetch and display ATIS and controllers
        const atis = await fetchAirportATIS(icao);
        const controllers = await fetchControllers(icao);
        displayATIS(atis);
        displayControllers(controllers);

        // Fetch inbound flights and flight details
        const inboundFlightIds = await fetchInboundFlightIds(icao);
        const flights = await fetchInboundFlightDetails(inboundFlightIds);

        // Handle case where no flights are found
        if (!flights || flights.length === 0) {
            console.warn(`No inbound flights found for ICAO: ${icao}`);
            renderFlightsTable(getFlights());
            return;
        }

        // Fetch and set airport coordinates
        const coordinates = await fetchAirportCoordinates(icao);
        if (!coordinates) throw new Error("Failed to fetch airport coordinates.");
        airportCoordinates = coordinates;
        
        // Clear previous flights and reset state
        allFlights = [];
        interpolatedFlights = [];

        // Update distances and ETAs for all inbound flights
        await updateDistancesAndETAs(flights, airportCoordinates);

        // Prepare interpolation data for real-time updates
        flights.forEach((flight) => {
            if (flight.latitude && flight.longitude && flight.speed > 0 && flight.heading != null) {
                flight.interpolatedPositions = fillGapsBetweenUpdates(
                    flight.latitude,
                    flight.longitude,
                    flight.speed,
                    flight.heading,
                    18 // 18-second interval
                );
            } else {
                flight.interpolatedPositions = [];
            }
        });

        // Update global state
        allFlights = flights;
        interpolatedFlights = JSON.parse(JSON.stringify(flights));
        lastApiUpdateTime = Date.now();

        // Log flight distance counts
        const distanceCounts = countInboundFlightsByDistance(allFlights);
        console.log("Inbound flight distance counts:", distanceCounts);

        // Render the updated table
        renderFlightsTable(getFlights());
    } catch (error) {
        console.error("Error fetching flights or controllers:", error.message);

        // Handle errors and fallback UI updates
        renderFlightsTable([]);
        if (document.getElementById('atisMessage')) {
            document.getElementById('atisMessage').textContent = "ATIS not available.";
        }
        if (document.getElementById('controllersList')) {
            document.getElementById('controllersList').textContent = "No controllers online.";
        }
    }
}


// interpolatedNextPositions
export function interpolateNextPositions(airportCoordinates) {
    if (isAutoUpdateActive === true) {
      console.error("Interpolation skipped as auto-update is off.");
      return;
    }

    if (!airportCoordinates) {
        console.error("Airport coordinates not available.");
        return;
    }

    const currentTime = Date.now();
    const secondsSinceLastApiUpdate = Math.floor((currentTime - lastApiUpdateTime) / 1000);

    if (secondsSinceLastApiUpdate > 18) {
        console.error("Interpolation exceeded 18 seconds. Waiting for the next API update.");
        
        return;
    }

    interpolatedFlights.forEach((flight) => {
        if (flight.interpolatedPositions.length > secondsSinceLastApiUpdate) {
            const interpolatedPosition = flight.interpolatedPositions[secondsSinceLastApiUpdate];

            // Update flight position
            flight.latitude = interpolatedPosition.latitude;
            flight.longitude = interpolatedPosition.longitude;

            // Recalculate distance and ETA
            try {
                if (flight.latitude && flight.longitude && flight.speed > 0) {
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
                } else {
                    flight.distanceToDestination = 'N/A';
                    flight.etaMinutes = 'N/A';
                }
            } catch (error) {
                console.error(
                    `Error recalculating for flight ${flight.callsign || 'Unknown'}:`,
                    error.message
                );
                flight.distanceToDestination = 'N/A';
                flight.etaMinutes = 'N/A';
            }
        }
     });

    renderFlightsTable(getFlights());
}


// Parses ETA string in "minutes:seconds" format to total seconds
export function parseETAInSeconds(eta) {
    if (typeof eta !== 'string' || eta === 'N/A' || eta.startsWith('>')) {
        return Number.MAX_SAFE_INTEGER; // Return a large number for invalid or undefined ETAs
    }

    const [minutes, seconds] = eta.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) {
        return Number.MAX_SAFE_INTEGER; // Return a large number for invalid formats
    }

    return minutes * 60 + seconds;
}

export function getFlights() {
    return allFlights && allFlights.length > 0 ? allFlights : interpolatedFlights;
}