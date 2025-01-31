import { fetchWorldData, fetchATCData, fetchStatusData } from "./api.js";
import { getCache, setCache, cacheExpiration } from "./cache.js";

export async function fetchActiveATCAirports() {
    try {
        const atcData = await fetchATCData();

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
        const worldData = await fetchWorldData();
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

// Fetch Controllers
async function fetchControllers(icao) {
    const cached = getCache(icao, 'controllers', cacheExpiration.controllers);
    if (cached) {
        displayControllers(cached); // Display cached controllers
        return cached;
    }

    try {
        const data = await fetchStatusData();
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


export function displayControllers(controllers, centerFrequencies = []) {
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
