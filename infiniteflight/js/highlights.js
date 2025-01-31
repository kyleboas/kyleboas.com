let headingHighlightEnabled = false;

// Clear all highlights
function clearHighlights() {
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