export function calculateDistance(lat1, lon1, lat2, lon2) {
    // Validate coordinates
    if (
        lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
    ) {
        throw new Error("Invalid coordinates provided for distance calculation.");
    }

    const R = 3440; // Earth's radius in nautical miles
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1), Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateBearing(lat1, lon1, lat2, lon2) {
    // Validate coordinates
    if (
        lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
    ) {
        throw new Error("Invalid coordinates provided for bearing calculation.");
    }

    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const toDegrees = (radians) => radians * (180 / Math.PI);

    const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
    const Δλ = toRadians(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return (toDegrees(Math.atan2(y, x)) + 360) % 360; // Normalize to 0–360
}

export function calculateETA(currentLat, currentLon, destLat, destLon, groundSpeed, heading) {
    // Validate inputs
    if (
        !groundSpeed || groundSpeed <= 0 ||
        currentLat == null || currentLon == null || destLat == null || destLon == null ||
        isNaN(currentLat) || isNaN(currentLon) || isNaN(destLat) || isNaN(destLon)
    ) {
        return 'N/A'; // Cannot calculate ETA without valid inputs
    }

    // Calculate the distance to the destination
    const distance = calculateDistance(currentLat, currentLon, destLat, destLon);
    if (!distance || distance <= 0) {
        return 'N/A'; // Cannot calculate ETA with invalid distance
    }

    // Calculate ETA in hours
    const timeInHours = distance / groundSpeed;

    // Convert hours to minutes and seconds
    const totalSeconds = Math.round(timeInHours * 3600);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    // Represent ETA above 12 hours
    if (totalMinutes > 720) {
        return '>12hrs';
    }

    // Format ETA as "minutes:seconds"
    return `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}