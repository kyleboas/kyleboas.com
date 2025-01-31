import { showMap } from "./map.js";
import { AutoUpdate } from "./AutoUpdate.js";
import { getFlights, fetchAndUpdateFlights, interpolateNextPositions } from "./flights.js";
import { renderFlightsTable } from "./flightsTable.js";
import { fetchControllers, fetchActiveATCAirports, renderATCTable } from "./atc.js";
import { fetchSecondaryATIS, fetchSecondaryControllers } from "./secondaryAirports.js";

// Store fetched flights globally for reuse
let flights = [];

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded.");

    // Fetch and update flights before getting them
    try {
        await fetchAndUpdateFlights(icao);  // Pass an initial ICAO code
        flights = getFlights();  // Now retrieve the updated flights
        console.log("Flights loaded:", flights);
    } catch (error) {
        console.error("Error fetching flights:", error);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded.");

    // Select necessary DOM elements
    const flightsTable = document.getElementById("flightsTable");
    const mapContainer = document.getElementById("mapContainer");
    const closeMapButton = document.getElementById("closeMapButton");
    const updateButton = document.getElementById("update");
    const icaoInput = document.getElementById("icao");

    // Validate essential elements
    if (!flightsTable || !mapContainer || !updateButton || !icaoInput) {
        console.error("Required elements not found in the DOM.");
        return;
    }

    // Fetch flight data on load
    try {
        flights = await getFlights();  // Ensure getFlights() is defined or imported
        console.log("Flights loaded:", flights);
    } catch (error) {
        console.error("Error fetching flights:", error);
    }

    // Handle flight row clicks to show map
    flightsTable.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (!row) return;

        const callsign = row.cells[0]?.textContent.trim();
        const flight = flights.find(f => f.callsign === callsign);

        if (flight) {
            console.log(`Showing map for flight: ${callsign}`, flight);
            showMap(flight);
        } else {
            console.warn(`Flight "${callsign}" not found.`);
        }
    });

    // Close map when close button is clicked
    if (closeMapButton) {
        closeMapButton.addEventListener("click", () => {
            mapContainer.style.display = "none";
        });
    }

    // Initialize auto-update manager
    const autoUpdate = new AutoUpdate (
        fetchAndUpdateFlights,
        interpolateNextPositions,
        fetchControllers,
        fetchActiveATCAirports,
        renderATCTable
    );

    // Handle update button clicks
    updateButton.addEventListener("click", () => {
        const icao = icaoInput.value.trim().toUpperCase();

        if (!icao) {
            alert("Please enter a valid ICAO code before updating.");
            return;
        }

        if (autoUpdate.isAutoUpdateActive) {
            autoUpdate.stop();
        } else {
            autoUpdate.start(icao);
        }
    });
});


 
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
        const secondaryAirportContainer = document.getElementById('secondaryAirportContainer');
        const airportDiv = document.createElement('div');
        airportDiv.id = `secondary-${secondaryIcao}`;
        airportDiv.className = 'secondaryAirport';
        airportDiv.innerHTML = `
            <p><strong>${secondaryIcao}</strong></p>
            <p class="secondary-atis" id="secondary-${secondaryIcao}-atis"></p>
            <p class="secondary-controllers" id="secondary-${secondaryIcao}-controllers"></p>
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
            ? controllers.map(ctrl => `${ctrl}<br>`).join('')
            : 'No active controllers available.';
    } catch (error) {
        console.error(`Error fetching data for secondary airport ${secondaryIcao}:`, error.message);
        alert(`Failed to fetch data for the secondary airport: ${secondaryIcao}`);
    }
});

// Event delegation for dynamically added "Remove" buttons
document.getElementById('secondaryAirportContainer').addEventListener('click', (event) => {
    if (event.target.classList.contains('removeAirportButton')) {
        const icao = event.target.getAttribute('data-icao');
        const airportDiv = document.getElementById(`secondary-${icao}`);

        if (airportDiv) {
            airportDiv.remove();
            console.log(`Removed secondary airport: ${icao}`);
        } else {
            console.warn(`Airport div not found for ICAO: ${icao}`);
        }
    }
});


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