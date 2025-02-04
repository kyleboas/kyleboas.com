// Live update function for average spacing in NM
function calculateLiveAverageSpacingInNM() {
    if (!Array.isArray(allFlights) || allFlights.length === 0) {
        console.warn("No flights available.");
        return "N/A";
    }

    const now = Date.now();
    const sixtyMinutesAgo = now - 60 * 60 * 1000; // 60 minutes ago in milliseconds

    // Filter flights within 13nm that were last reported in the past 60 minutes
    const recentFlights = allFlights
        .filter(flight => 
            flight.distanceToDestination <= 13 &&
            flight.lastReport && (new Date(flight.lastReport).getTime() >= sixtyMinutesAgo)
        )
        .map(flight => ({
            callsign: flight.callsign || "N/A",
            latitude: flight.latitude,
            longitude: flight.longitude,
            timestamp: new Date(flight.lastReport).getTime(),
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

    if (recentFlights.length < 2) {
        return "N/A"; // Not enough flights to calculate spacing
    }

    // Function to calculate distance between two coordinates (Haversine formula)
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

    // Calculate spacing distances between consecutive flights
    let totalDistance = 0;
    let count = 0;

    for (let i = 1; i < recentFlights.length; i++) {
        const distance = calculateDistance(
            recentFlights[i - 1].latitude, recentFlights[i - 1].longitude,
            recentFlights[i].latitude, recentFlights[i].longitude
        );

        totalDistance += distance;
        count++;
    }

    const averageSpacingNM = totalDistance / count;
    return averageSpacingNM.toFixed(2) + " nm";
}

// Function to update the displayed value in the UI
function updateLiveSpacingDisplay() {
    const spacingElement = document.getElementById("liveSpacing");
    if (!spacingElement) return;

    const liveSpacing = calculateLiveAverageSpacingInNM();
    spacingElement.textContent = `Live Average Spacing: ${liveSpacing}`;
}

// Auto-update every 5 seconds
setInterval(updateLiveSpacingDisplay, 5000);