import { SESSION_ID } from './constants.js';
import { setCache, getCache, cacheExpiration } from './utils.js';
import { fetchWithProxy } from './fetch.js';

export let atcDataCache = null;
export let atcDataFetchPromise = null;

export async function fetchATCData() {
    // Return cached data if available
    if (atcDataCache) {
        return atcDataCache;
    }

    // Return the ongoing fetch promise if one exists
    if (atcDataFetchPromise) {
        return atcDataFetchPromise;
    }

    // Start the fetch process
    atcDataFetchPromise = fetchWithProxy(`/sessions/${SESSION_ID}/atc`)
        .then((data) => {
            // Basic validation
            if (!data || data.errorCode !== 0 || !Array.isArray(data.result)) {
                console.error("Invalid ATC data received:", data);
                throw new Error("Invalid ATC data format.");
            }

            // Cache the result
            atcDataCache = data.result;
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

export function clearATCDataCache() {
    atcDataCache = null;
    atcDataFetchPromise = null;
}

export async function fetchActiveATCAirports() {
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

        // Insert a `<br>` after the second airport if there are at least three
        if (formattedAirports.length > 2) {
            formattedAirports[1] += "<br>"; // Append <br> after the second airport
        }

        // Join the output with spaces only (no commas)
        const formattedOutput = formattedAirports.join(" ");

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
export async function fetchActiveATCAirportsData() {
    try {
        const atcData = await fetchATCData();

        // Validate the ATC data
        if (!Array.isArray(atcData)) {
            console.error("Invalid ATC data received:", atcData);
            throw new Error("Invalid ATC data format.");
        }

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

// Render ATC Table
export async function renderATCTable() {
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