import { getCookie } from './cookies.js'; // Assuming getCookie is in a separate utility module
import { renderFlightsTable } from './FlightsTable.js'; // Assuming renderFlightsTable is defined in flights.js


export function applyDefaults() {
    // Load and apply default headings
    const defaultMinHeading = parseFloat(getCookie('defaultMinHeading'));
    const defaultMaxHeading = parseFloat(getCookie('defaultMaxHeading'));

    if (!isNaN(defaultMinHeading) && !isNaN(defaultMaxHeading)) {
        document.getElementById('minHeading').value = defaultMinHeading;
        document.getElementById('maxHeading').value = defaultMaxHeading;
        boldHeadingEnabled = false;
        boldedHeadings.minHeading = defaultMinHeading;
        boldedHeadings.maxHeading = defaultMaxHeading;
    }

    // Load and apply default distances
    const defaultMinDistance = parseFloat(getCookie('defaultMinDistance'));
    const defaultMaxDistance = parseFloat(getCookie('defaultMaxDistance'));

    if (!isNaN(defaultMinDistance) && !isNaN(defaultMaxDistance)) {
        document.getElementById('minDistance').value = defaultMinDistance;
        document.getElementById('maxDistance').value = defaultMaxDistance;
        applyDistanceFilterEnabled = false;
        hiddenDistance.minDistance = defaultMinDistance;
        hiddenDistance.maxDistance = defaultMaxDistance;
    }

    renderFlightsTable(globalThis.getFlights);
}