import { allFlights, boldHeadingEnabled, boldedHeadings, hiddenDistance, applyDistanceFilterEnabled } from './constants.js';

export function clearHighlights() {
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    rows.forEach(row => {
        row.style.backgroundColor = ''; // Reset background color
    });
}

export function highlightCloseETAs() {
    clearHighlights();
    
    const rows = document.querySelectorAll('#flightsTable tbody tr');
    if (!rows.length) return; // Exit if no rows exist

    // Determine groups: All flights if no filter, or split into bold/non-bold based on heading
    let boldGroup = allFlights;
    let nonBoldGroup = [];

    if (boldHeadingEnabled) {
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
            const color