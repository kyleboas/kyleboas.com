import { showMap } from "./map.js";
import { fetchAndUpdateFlights, interpolateNextPositions, getFlights } from "./flights.js";
import { fetchControllers, fetchActiveATCAirports } from "./ATC.js";
import { renderATCTable } from "./atcTable.js";
import { fetchSecondaryATIS, fetchSecondaryControllers } from "./secondaryAirports.js";
import { renderFlightsTable } from "./flightsTable.js";
import { highlightCloseETAs } from "./highlights.js";
import { setCookie } from "./cookies.js";

// Store fetched flights globally for reuse
export let flights = [];
export let headingFilterActive = false;
export let boldedHeadings = { minHeading: null, maxHeading: null };
export let hiddenDistance = { minDistance: null, maxDistance: null };
let distanceFilterActive = false;
export let minDistance = null;
export let maxDistance = null;
export let hideOtherAircraft = false;
export let boldHeadingEnabled = false;
export let applyDistanceFilterEnabled = false;

// Export ICAO so it can be used in other modules
export let selectedICAO = "";

document.addEventListener('DOMContentLoaded', async () => {
    applyDefaults();

    try {
        await fetchActiveATCAirports();
        await renderATCTable();
    } catch (error) {
        console.error('Error initializing ATC table:', error.message);
    }

    setupEventListeners();
});

export let isAutoUpdateActive = false;
export let flightUpdateInterval = null;
export let interpolateInterval = null;
export let atcUpdateInterval = null;

/**
 * Sets up event listeners for user interactions.
 */
function setupEventListeners() {
    const searchButton = document.getElementById("search");
    const selectedICAO = document.getElementById("icao");
    const updateButton = document.getElementById("update");

    if (searchButton) {
        searchButton.addEventListener("click", async () => {
            await handleSearch();
        });
    }

    if (selectedICAO) {
        selectedICAO.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await handleSearch();
            }
        });
    }

    if (updateButton) {
        updateButton.addEventListener("click", () => {
            if (!selectedICAO) {
                alert("Please enter a valid ICAO code before updating.");
                return;
            }

            if (isAutoUpdateActive) {
                stopAutoUpdate();
            } else {
                startAutoUpdate(selectedICAO);
            }
        });
    }
}

/**
 * Handles user search functionality.
 */
async function handleSearch() {
    const icaoInput = document.getElementById("icao");
    const icao = icaoInput.value.trim().toUpperCase();

    if (!icao) {
        alert("Please enter a valid ICAO code.");
        return;
    }

    // Update exported ICAO variable
    selectedICAO = icao;

    stopAutoUpdate();

    // Reset state
    allFlights = [];
    interpolatedFlights = [];
    airportCoordinates = null;
    lastApiUpdateTime = null;

    const tableBody = document.querySelector("#flightsTable tbody");
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    }

    try {
        await fetchAndUpdateFlights(icao);
        startAutoUpdate(icao);
    } catch (error) {
        console.error("Error during search:", error.message);
        alert("Failed to fetch and update flights. Please try again.");
    }
}

/**
 * Starts auto-update for flight and ATC data.
 */
export function startAutoUpdate(icao) {
    selectedICAO = icao; // Ensure ICAO is set
    isAutoUpdateActive = true;
    updateButtonState(true);

    interpolateInterval = setInterval(async () => {
        try {
            interpolateNextPositions(airportCoordinates);
        } catch (error) {
            handleUpdateError(error, "interpolated flight updates");
        }
    }, 1000);

    flightUpdateInterval = setInterval(async () => {
        try {
            await fetchAndUpdateFlights(icao);
        } catch (error) {
            handleUpdateError(error, "flight updates");
        }
    }, 18000);

    atcUpdateInterval = setInterval(async () => {
        try {
            await fetchControllers(icao);
            await fetchActiveATCAirports();
            await renderATCTable();
        } catch (error) {
            handleUpdateError(error, "ATC updates");
        }
    }, 60000);
}

/**
 * Stops all auto-update intervals.
 */
export function stopAutoUpdate() {
    isAutoUpdateActive = false;
    updateButtonState(false);

    if (flightUpdateInterval) clearInterval(flightUpdateInterval);
    if (interpolateInterval) clearInterval(interpolateInterval);
    if (atcUpdateInterval) clearInterval(atcUpdateInterval);

    flightUpdateInterval = null;
    interpolateInterval = null;
    atcUpdateInterval = null;

    console.log("Auto-update and interpolation stopped.");
}

/**
 * Handles update errors, especially rate limits.
 */
function handleUpdateError(error, updateType) {
    console.error(`Error during ${updateType}:`, error.message);
    if (error.message.includes("rate limit") || error.message.includes("fetch")) {
        alert("Rate limit or network error encountered. Updates stopped.");
        stopAutoUpdate();
    }
}

/**
 * Updates the UI state of the update button.
 */
function updateButtonState(isActive) {
    const updateButton = document.getElementById("update");

    if (updateButton) {
        updateButton.style.color = isActive ? "blue" : "#828282";
        const icon = updateButton.querySelector("i");
        if (icon) {
            if (isActive) {
                icon.classList.add("spin");
            } else {
                icon.classList.remove("spin");
            }
        }
    }
}


console.log("Current ICAO:", selectedICAO);


 
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