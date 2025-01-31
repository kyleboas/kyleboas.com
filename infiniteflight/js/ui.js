// Helper Function: Update row visibility and styling

export function updateRowVisibility(row, flight) {
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