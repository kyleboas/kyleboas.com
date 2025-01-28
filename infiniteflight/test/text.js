    if (!isAutoUpdateActive) {
        console.warn("Interpolation skipped as auto-update is off.");
        return;
    }


// ============================
// Auto-Update
// ============================
let isAutoUpdateActive = false;

// Stop auto-update
function stopAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    if (updateTimeout) clearTimeout(updateTimeout);
    if (countdownInterval) clearInterval(countdownInterval);

    updateInterval = null;
    updateTimeout = null;
    countdownInterval = null;
    isAutoUpdateActive = false;
}

// Start auto-update
    function startAutoUpdate(icao) {
    isAutoUpdateActive = true;
    // ...other logic
}

// ============================
// Interpolation
// ============================
function interpolateNextPositions(airportCoordinates) {
    if (!isAutoUpdateActive) {
        console.error("Interpolation skipped as auto-update is stopped.");
        return;
    }

    if (!airportCoordinates) {
        console.error("Airport coordinates not available.");
        return;
    }

    const currentTime = Date.now();
    const secondsSinceLastApiUpdate = Math.floor((currentTime - lastApiUpdateTime) / 1000);

    if (secondsSinceLastApiUpdate > 20) {
        console.warn("Interpolation exceeded 20 seconds. Waiting for the next API update.");
        return;
    }

    interpolatedFlights.forEach((flight) => {
        if (flight.interpolatedPositions.length > secondsSinceLastApiUpdate) {
            const interpolatedPosition = flight.interpolatedPositions[secondsSinceLastApiUpdate];
            flight.latitude = interpolatedPosition.latitude;
            flight.longitude = interpolatedPosition.longitude;

            try {
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
                } else {
                    flight.distanceToDestination = 'N/A';
                    flight.etaMinutes = 'N/A';
                }
            } catch (error) {
                console.error(
                    `Error recalculating for flight ${flight.callsign || 'Unknown'}:`,
                    error.message
                );
                flight.distanceToDestination = 'N/A';
                flight.etaMinutes = 'N/A';
            }
        }
    });

    renderFlightsTable(getFlights());
}