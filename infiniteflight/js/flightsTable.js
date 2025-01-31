import { pairAircraftData } from "./aircraft.js";
import { calculateDistance, calculateETA, parseETAInSeconds, getlFlights } from "./flights.js";
import { airportCoordinates } from "./airport.js";
import { updateRowVisibility, getHeadingArrow } from "./ui.js";
import { minDistance, maxDistance, boldHeadingEnabled, boldedHeadings } from "./main.js";
import { highlightCloseETAs } from "./highlights.js";
import { lastApiUpdateTime } from "./autoUpdate.js";
import { setCookie } from "./cookies.js";

export async function renderFlightsTable(getFlights, hideFilter = false) {
    const tableBody = document.querySelector("#flightsTable tbody");
    if (!tableBody) {
        console.error("Flights table body not found in DOM.");
        return;
    }

    tableBody.innerHTML = "";

    if (!Array.isArray(allFlights) || allFlights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No inbound flights found.</td></tr>';
        return;
    }
    
    if (!airportCoordinates) {
    console.error("Airport coordinates are not available.");
    return;
    }

    try {
        const aircraftIds = allFlights.map(flight => flight.aircraftId);
        const aircraftMachDetails = await pairAircraftData(aircraftIds);

        // Sort flights by ETA
        allFlights.sort((a, b) => parseETAInSeconds(a.etaMinutes) - parseETAInSeconds(b.etaMinutes));

        allFlights.forEach(flight => {
            const row = document.createElement("tr");

            // Handle visibility and filtering
            const isWithinDistanceRange = (minDistance === null && maxDistance === null) || (
                typeof flight.distanceToDestination === 'number' &&
                flight.distanceToDestination >= (minDistance ?? 0) &&
                flight.distanceToDestination <= (maxDistance ?? Infinity)
            );

            const isOtherAircraft = !hideFilter || (boldHeadingEnabled &&
                (flight.headingFromAirport < boldedHeadings.minHeading ||
                 flight.headingFromAirport > boldedHeadings.maxHeading));

            const isVisible = isWithinDistanceRange;

            // Apply styles for hidden or visible aircraft
            row.style.display = isVisible ? '' : 'none';
            row.style.opacity = isOtherAircraft && hideFilter ? '0.3' : '1';
            row.style.pointerEvents = isOtherAircraft && hideFilter ? 'none' : 'auto';

            // Recalculate distance and ETA dynamically if interpolated positions exist
            if (flight.interpolatedPositions && flight.interpolatedPositions.length) {
                const currentTime = Date.now();
                const secondsSinceLastApiUpdate = Math.floor((currentTime - lastApiUpdateTime) / 1000);

                if (secondsSinceLastApiUpdate < flight.interpolatedPositions.length) {
                    const interpolatedPosition = flight.interpolatedPositions[secondsSinceLastApiUpdate];
                    flight.latitude = interpolatedPosition.latitude;
                    flight.longitude = interpolatedPosition.longitude;

                    // Recalculate distance and ETA
                    if (flight.latitude && flight.longitude && flight.speed > 0) {
                        flight.distanceToDestination = Math.ceil(
                            calculateDistance(
                                flight.latitude,
                                flight.longitude,
                                airportCoordinates.latitude,
                                airportCoordinates.longitude
                            )
                        );
                        flight.etaMinutes = calculateETA(
                            flight.latitude,
                            flight.longitude,
                            airportCoordinates.latitude,
                            airportCoordinates.longitude,
                            flight.speed,
                            flight.heading
                        );
                    }
                }
            }

            // Add flight data to the table row
            const aircraftName = flight.aircraftName || "UNKN";
            const machDetails = aircraftMachDetails[flight.aircraftId] || { minMach: "N/A", maxMach: "N/A" };
            const minMach = machDetails.minMach !== "N/A" ? machDetails.minMach.toFixed(2) : "N/A";
            const maxMach = machDetails.maxMach !== "N/A" ? machDetails.maxMach.toFixed(2) : "N/A";
            const groundSpeed = flight.speed !== "N/A" ? flight.speed.toFixed(0) : "N/A";
            const machValue = flight.speed !== "N/A" ? (flight.speed / 666.739).toFixed(2) : "N/A";
            const heading = flight.headingFromAirport !== "N/A" ? Math.round(flight.headingFromAirport) : "N/A";
            const altitude = flight.altitude !== "N/A" ? flight.altitude.toFixed(0) : "N/A";
            const distance = flight.distanceToDestination !== "N/A" ? `${flight.distanceToDestination}` : "N/A";
            const eta = flight.etaMinutes !== "N/A" ? `${flight.etaMinutes}` : "N/A";

            row.innerHTML = `
                <td>
                    <strong>${flight.callsign || "N/A"}</strong><br>
                    <small>${aircraftName}</small>
                </td>
                <td>
                    ${minMach}M<br>
                    ${maxMach}M
                </td>
                <td>
                    ${groundSpeed}knts<br>
                    ${machValue}M
                </td>
                <td>
                    ${heading}${getHeadingArrow(flight.headingFromAirport)}<br>
                    ${altitude}ft
                </td>
                <td>
                    ${distance}nm<br>
                    ${eta}
                </td>
            `;

            // Update row visibility and append to table
            updateRowVisibility(row, flight);
            tableBody.appendChild(row);
        });

        highlightCloseETAs(); // Highlight rows based on close ETAs
    } catch (error) {
        console.error("Error rendering the flights table:", error.message);
        tableBody.innerHTML = '<tr><td colspan="5">Error populating table. Check console for details.</td></tr>';
    }
}