function calculateRunwaySpacing(allFlights, runways) {
    if (!Array.isArray(allFlights) || allFlights.length === 0) {
        console.warn("No flights available.");
        return {};
    }

    const now = Date.now();
    const sixtyMinutesAgo = now - 60 * 60 * 1000; // 60 minutes ago in milliseconds

    // Function to calculate distance (Haversine formula)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3440; // Earth's radius in nautical miles
        const toRadians = (deg) => (deg * Math.PI) / 180;

        const φ1 = toRadians(lat1);
        const φ2 = toRadians(lat2);
        const Δφ = toRadians(lat2 - lat1);
        const Δλ = toRadians(lon2 - lon1);

        const a = Math.sin(Δφ / 2) ** 2 +
                  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Assign aircraft to the closest runway
    function determineRunway(flight) {
        let closestRunway = null;
        let minDistance = Infinity;

        runways.forEach(runway => {
            const leDistance = calculateDistance(
                flight.latitude, flight.longitude,
                parseFloat(runway.le_latitude_deg), parseFloat(runway.le_longitude_deg)
            );

            const heDistance = calculateDistance(
                flight.latitude, flight.longitude,
                parseFloat(runway.he_latitude_deg), parseFloat(runway.he_longitude_deg)
            );

            // Find the closest runway endpoint
            if (leDistance < minDistance) {
                minDistance = leDistance;
                closestRunway = runway.le_ident;
            }
            if (heDistance < minDistance) {
                minDistance = heDistance;
                closestRunway = runway.he_ident;
            }
        });

        return closestRunway;
    }

    // Group aircraft by runway
    const runwayFlights = {};

    allFlights
        .filter(flight => flight.lastReport && (new Date(flight.lastReport).getTime() >= sixtyMinutesAgo))
        .forEach(flight => {
            const runway = determineRunway(flight);
            if (!runway) return;

            if (!runwayFlights[runway]) {
                runwayFlights[runway] = [];
            }

            runwayFlights[runway].push({
                callsign: flight.callsign || "N/A",
                latitude: flight.latitude,
                longitude: flight.longitude,
                timestamp: new Date(flight.lastReport).getTime(),
            });
        });

    // Calculate average spacing for each runway
    const runwaySpacing = {};

    Object.keys(runwayFlights).forEach(runway => {
        const flights = runwayFlights[runway].sort((a, b) => a.timestamp - b.timestamp);

        if (flights.length < 2) {
            runwaySpacing[runway] = "N/A"; // Not enough flights
            return;
        }

        let totalDistance = 0;
        let count = 0;

        for (let i = 1; i < flights.length; i++) {
            const distance = calculateDistance(
                flights[i - 1].latitude, flights[i - 1].longitude,
                flights[i].latitude, flights[i].longitude
            );

            if (distance >= 1) {  // Ignore aircraft within 1nm
                totalDistance += distance;
                count++;
            }
        }

        runwaySpacing[runway] = count === 0 ? "N/A" : `${(totalDistance / count).toFixed(2)} nm`;
    });

    return runwaySpacing;
}

// Function to update the UI
function updateRunwaySpacingDisplay() {
    const spacingElement = document.getElementById("runwaySpacing");
    if (!spacingElement) return;

    const runways = [
        {
            le_ident: "09L",
            le_latitude_deg: "39.8687",
            le_longitude_deg: "-75.2557",
            he_ident: "27R",
            he_latitude_deg: "39.8752",
            he_longitude_deg: "-75.2229"
        }
    ];

    const runwaySpacing = calculateRunwaySpacing(allFlights, runways);

    // Display results
    spacingElement.innerHTML = Object.entries(runwaySpacing)
        .map(([runway, spacing]) => `${runway}: ${spacing}`)
        .join("<br>");
}

// Auto-update every 5 seconds
setInterval(updateRunwaySpacingDisplay, 5000);