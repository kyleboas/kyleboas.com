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