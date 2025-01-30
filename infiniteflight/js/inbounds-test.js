import { pairAircraftData } from "./aircraft.js";


function getFlights() {
    return allFlights && allFlights.length > 0 ? allFlights : interpolatedFlights;
}

// ============================
// ATC
// ============================


async function fetchActiveATCAirports() {
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

// ============================
// Airport
// ============================

// Fetch airport latitude and longitude
async function fetchAirportCoordinates(icao) {
    const cached = getCache(icao, 'airportCoordinates', cacheExpiration.airportCoordinates);
    if (cached) {
        return cached;
    }
    
    try {
        const data = await fetchAirport;
        const coordinates = { latitude: data.result.latitude, longitude: data.result.longitude };
        setCache(icao, coordinates, 'airportCoordinates');
        return coordinates;
    } catch (error) {
        console.error('Error fetching airport coordinates:', error.message);
        alert('Failed to fetch airport coordinates.');
        return null;
    }
}

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
// ATIS
// ============================


// Fetch ATIS
async function fetchAirportATIS(icao) {
    const atisElement = document.getElementById('atisMessage');

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
// /Flights
// ============================

// ============================
// Calculations
// ============================


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
        const isHidden =
            currentRow.style.display === 'none' ||
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

        let highlightColor = null;

        // Compare with the next flight in the group
        if (index + 1 < group.length) {
            const nextFlight = group[index + 1];
            const timeDiff = Math.abs(
                parseETAInSeconds(flight.etaMinutes) -
                parseETAInSeconds(nextFlight.etaMinutes)
            );
            const color = getHighlightColor(timeDiff);

            if (color) {
                highlightColor = getHigherPriorityColor(highlightColor, color);
            }
        }

        // Compare with the previous flight in the group
        if (index > 0) {
            const prevFlight = group[index - 1];
            const timeDiff = Math.abs(
                parseETAInSeconds(flight.etaMinutes) -
                parseETAInSeconds(prevFlight.etaMinutes)
            );
            const color = getHighlightColor(timeDiff);

            if (color) {
                highlightColor = getHigherPriorityColor(highlightColor, color);
            }
        }

        // Update row highlights
        const etaCell = currentRow.querySelector('td:nth-child(5)');
        if (etaCell && flight.etaMinutes !== 'N/A') {
            etaCell.innerHTML = `${flight.distanceToDestination}nm<br>${flight.etaMinutes}`; // Show NM and MM:SS
        }

        // Apply or clear highlight
        applyHighlight(currentRow, highlightColor);
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
    const currentColor = rgbToHex(row.style.backgroundColor);
    
    if (!currentColor || getHigherPriorityColor(color, currentColor) === color) {
        row.style.backgroundColor = color;
        
        if (color) {
            row.classList.add('highlighted');
        }
    }

    if (!color) {
        row.style.backgroundColor = '';
        row.classList.remove('highlighted');
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

// ============================
// Buttons
// ============================

// Toggle Heading Button Functionality

// Modify the toggleHeadingButton click listener
document.getElementById('toggleHeadingButton').addEventListener('click', () => {
    hideOtherAircraft = !hideOtherAircraft;

    document.getElementById('toggleHeadingButton').textContent = hideOtherAircraft
        ? 'Disable'
        : 'Hide';

    boldHeadingButton.style.backgroundColor = boldHeadingEnabled ? 'blue' : '#c2c2c2';

    // Re-render the table with the hideFilter flag
    renderFlightsTable(getFlights, hideOtherAircraft);
});


// Toggle Heading Highlight and reapply highlights

const filterHeadingHighlightBorder = document.getElementById('filterHeadingHighlightBorder');
const filterHeadingHighlightButton = document.getElementById('filterHeadingHighlightButton');

filterHeadingHighlightButton.addEventListener('click', () => {
    const minHeadingInput = document.getElementById('minHeading').value;
    const maxHeadingInput = document.getElementById('maxHeading').value;

    const minHeading = parseFloat(minHeadingInput);
    const maxHeading = parseFloat(maxHeadingInput);

    // Validate inputs
    if (isNaN(minHeading) || isNaN(maxHeading) || minHeading > maxHeading) {
        alert('Please enter valid Min Heading and Max Heading values.');
        return;
    }

    // Save defaults to cookies
    setCookie('defaultMinHeading', minHeading, 30);
    setCookie('defaultMaxHeading', maxHeading, 30);

    // Toggle headingHighlightEnabled
    headingHighlightEnabled = !headingHighlightEnabled;

    // Update border styles based on state
    filterHeadingHighlightBorder.style.borderLeftColor = headingHighlightEnabled ? 'blue' : '#bbb';
    filterHeadingHighlightBorder.style.borderLeftWidth = headingHighlightEnabled ? '5px' : '2px';
    filterHeadingHighlightBorder.style.borderLeftStyle = 'solid';

    // Reapply highlights
    highlightCloseETAs();
});


// Bold Heading Button Functionality

const boldHeadingBorder = document.getElementById('boldHeadingBorder');
const boldHeadingButton = document.getElementById('boldHeadingButton');

boldHeadingButton.addEventListener('click', () => {
    const minHeading = parseFloat(document.getElementById('minHeading').value);
    const maxHeading = parseFloat(document.getElementById('maxHeading').value);

    if (isNaN(minHeading) || isNaN(maxHeading) || minHeading > maxHeading) {
        alert('Please enter valid minimum and maximum heading values.');
        return;
    }

    // Toggle boldHeadingEnabled and update button text
    boldHeadingEnabled = !boldHeadingEnabled;
    boldHeadingBorder.style.borderLeftColor = boldHeadingEnabled ? 'blue' : '#bbb';
    boldHeadingBorder.style.borderLeftWidth = boldHeadingEnabled ? '5px' : '2px';
    boldHeadingBorder.style.borderLeftStyle = 'solid';

    // Update boldedHeadings range
    boldedHeadings.minHeading = minHeading;
    boldedHeadings.maxHeading = maxHeading;

    // Re-render the table
    renderFlightsTable(getFlights);
});


// Toggle Apply Distance Filter

const applyDistanceFilterBorder = document.getElementById('applyDistanceFilterBorder');
const applyDistanceFilterButton = document.getElementById('applyDistanceFilterButton');

applyDistanceFilterButton.addEventListener('click', () => {
    const minDistanceInput = document.getElementById('minDistance').value;
    const maxDistanceInput = document.getElementById('maxDistance').value;

    const minDistance = parseFloat(minDistanceInput);
    const maxDistance = parseFloat(maxDistanceInput);

    // Validate inputs
    if (isNaN(minDistance) || isNaN(maxDistance) || minDistance > maxDistance) {
        alert('Please enter valid Min Distance and Max Distance values.');
        return;
    }

    // Save defaults to cookies
    setCookie('defaultMinDistance', minDistance, 30);
    setCookie('defaultMaxDistance', maxDistance, 30);

    // Toggle applyDistanceFilterEnabled
    applyDistanceFilterEnabled = !applyDistanceFilterEnabled;

    // Update border styles based on state
    applyDistanceFilterBorder.style.borderLeftColor = applyDistanceFilterEnabled ? 'blue' : '#bbb';
    applyDistanceFilterBorder.style.borderLeftWidth = applyDistanceFilterEnabled ? '5px' : '2px';
    applyDistanceFilterBorder.style.borderLeftStyle = 'solid';

    // Update hidden distance range
    hiddenDistance.minDistance = minDistance;
    hiddenDistance.maxDistance = maxDistance;

    // Re-render flights table
    renderFlightsTable(getFlights);
});

// Helper Function: Update row visibility and styling

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


// Export functions
export {
    getFlights,
    allFlights,
    fetchAirportCoordinates,
    fetchAndUpdateFlights,
    interpolateNextPositions,
    fetchControllers, 
    fetchActiveATCAirports,
    renderATCTable
};