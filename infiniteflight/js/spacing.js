import { fetchAirportData } from "./airport.js";
import { allFlights } from "./inbounds.js";

// Function to calculate distance using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3440;
    const toRadians = (deg) => (deg * Math.PI) / 180;

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Determine which aircraft is aligned with the runway
async function getRunwayAlignedAircraft() {
    console.log("Fetching airport data for runway alignment...");
    const airportData = await fetchAirportData();
    console.log("Airport data received:", airportData);
    
    if (!airportData) {
        console.log("No airport data available");
        return [];
    }

    const runways = airportData.runways || [];
    console.log("Number of runways:", runways.length);
    console.log("Number of flights:", allFlights.length);
    
    if (!runways.length) return [];

    return runways.map(runway => {
        const alignedAircraft = allFlights.filter(flight => {
            if (!flight.latitude || !flight.longitude || !flight.heading) return false;

            // Determine proximity to runway threshold
            const distToLE = calculateDistance(flight.latitude, flight.longitude, 
                                               parseFloat(runway.le_latitude_deg), 
                                               parseFloat(runway.le_longitude_deg));
            const distToHE = calculateDistance(flight.latitude, flight.longitude, 
                                               parseFloat(runway.he_latitude_deg), 
                                               parseFloat(runway.he_longitude_deg));

            // Check heading alignment (within ±10 degrees)
            const alignedWithLE = Math.abs(flight.heading - parseFloat(runway.le_heading_degT)) <= 10;
            const alignedWithHE = Math.abs(flight.heading - parseFloat(runway.he_heading_degT)) <= 10;

            // Aircraft must be within 13nm of the threshold
            const inFinalApproach = distToLE <= 13 || distToHE <= 13;

            return (alignedWithLE && distToLE < distToHE) || (alignedWithHE && distToHE < distToLE) ? inFinalApproach : false;
        });

        console.log(`Runway ${runway.le_ident}/${runway.he_ident} has ${alignedAircraft.length} aligned aircraft`);

        // Sort aircraft by distance to threshold
        alignedAircraft.sort((a, b) => {
            const distA = Math.min(
                calculateDistance(a.latitude, a.longitude, parseFloat(runway.le_latitude_deg), parseFloat(runway.le_longitude_deg)),
                calculateDistance(a.latitude, a.longitude, parseFloat(runway.he_latitude_deg), parseFloat(runway.he_longitude_deg))
            );
            const distB = Math.min(
                calculateDistance(b.latitude, b.longitude, parseFloat(runway.le_latitude_deg), parseFloat(runway.le_longitude_deg)),
                calculateDistance(b.latitude, b.longitude, parseFloat(runway.he_latitude_deg), parseFloat(runway.he_longitude_deg))
            );
            return distA - distB;
        });

        return {
            runway: `${runway.le_ident}/${runway.he_ident}`,
            aircraft: alignedAircraft
        };
    });
}

// Calculate spacing between aircraft on the same runway
async function calculateRunwaySpacing() {
    const runwayAircraftData = await getRunwayAlignedAircraft();
    if (!runwayAircraftData.length) return [];

    const spacingData = runwayAircraftData.map(({ runway, aircraft }) => {
        if (aircraft.length < 2) return { runway, spacing: "N/A" };

        let totalDistance = 0, count = 0;

        for (let i = 1; i < aircraft.length; i++) {
            totalDistance += calculateDistance(
                aircraft[i - 1].latitude, aircraft[i - 1].longitude,
                aircraft[i].latitude, aircraft[i].longitude
            );
            count++;
        }

        const averageSpacingNM = (totalDistance / count).toFixed(2) + " nm";
        return { runway, spacing: averageSpacingNM };
    });

    return spacingData;
}

// Function to update UI with calculated spacing
async function updateRunwaySpacingDisplay() {
    const spacingElement = document.getElementById("runwaySpacing");
    if (!spacingElement) {
        console.log("Spacing element not found in DOM");
        return;
    }

    const spacingData = await calculateRunwaySpacing();
    if (!spacingData.length) {
        spacingElement.innerHTML = "<p>No runway spacing data available</p>";
        return;
    }

    spacingElement.innerHTML = spacingData.map(({ runway, spacing }) => 
        `<p>${runway}: ${spacing}</p>`
    ).join("");
}

export { getRunwayAlignedAircraft, calculateRunwaySpacing, updateRunwaySpacingDisplay };