import { fetchAirportData } from "./airport.js";
import { allFlights } from "./inbounds.js";

let updateInterval = null;

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3440; // Nautical miles
    const toRadians = (deg) => (deg * Math.PI) / 180;

    const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1), Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getRunwayAlignedAircraft() {
    try {
        const airportData = await fetchAirportData();
        if (!airportData || !airportData.runways) throw new Error("Invalid airport data");

        return airportData.runways.map(runway => {
            const alignedAircraft = allFlights.filter(flight => {
                if (!flight.latitude || !flight.longitude || !flight.heading) return false;

                const distToLE = calculateDistance(flight.latitude, flight.longitude, 
                                                   parseFloat(runway.le_latitude_deg), 
                                                   parseFloat(runway.le_longitude_deg));
                const distToHE = calculateDistance(flight.latitude, flight.longitude, 
                                                   parseFloat(runway.he_latitude_deg), 
                                                   parseFloat(runway.he_longitude_deg));

                const alignedWithLE = Math.abs(flight.heading - parseFloat(runway.le_heading_degT)) <= 10 && distToLE <= 13;
                const alignedWithHE = Math.abs(flight.heading - parseFloat(runway.he_heading_degT)) <= 10 && distToHE <= 13;

                return alignedWithLE || alignedWithHE;
            });

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

            return { runway: `${runway.le_ident}/${runway.he_ident}`, aircraft: alignedAircraft };
        });
    } catch (error) {
        console.error("Error fetching runway-aligned aircraft:", error.message);
        return [];
    }
}

async function calculateRunwaySpacing() {
    try {
        const runwayAircraftData = await getRunwayAlignedAircraft();
        if (!runwayAircraftData.length) throw new Error("No valid runway data");

        const airportData = await fetchAirportData();
        if (!airportData) throw new Error("Invalid airport data");

        const { latitude: airportLat, longitude: airportLon } = airportData;

        return runwayAircraftData.map(({ runway, aircraft }) => {
            const validAircraft = aircraft.filter(flight => {
                const distFromAirport = calculateDistance(
                    flight.latitude, flight.longitude, airportLat, airportLon
                );
                return distFromAirport >= 2 && distFromAirport <= 45;
            });

            if (validAircraft.length < 2) return { runway, spacing: "N/A" };

            validAircraft.sort((a, b) => {
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

            let totalDistance = 0, count = 0;
            for (let i = 1; i < validAircraft.length; i++) {
                totalDistance += calculateDistance(
                    validAircraft[i - 1].latitude, validAircraft[i - 1].longitude,
                    validAircraft[i].latitude, validAircraft[i].longitude
                );
                count++;
            }

            const avgSpacing = count > 0 ? (totalDistance / count).toFixed(2) + " nm" : "N/A";
            return { runway, spacing: avgSpacing };
        });
    } catch (error) {
        console.error("Error calculating spacing:", error.message);
        return "N/A";
    }
}

async function updateRunwaySpacingDisplay() {
    try {
        const spacingElement = document.getElementById("runwaySpacing");
        if (!spacingElement) return;

        const spacingData = await calculateRunwaySpacing();
        if (spacingData === "N/A") {
            console.warn("No valid data, stopping updates.");
            if (updateInterval) clearInterval(updateInterval);
            return;
        }

        spacingElement.innerHTML = spacingData.map(({ runway, spacing }) => 
            `<p>${runway}: ${spacing}</p>`
        ).join("");

    } catch (error) {
        console.error("Error updating display:", error.message);
        if (updateInterval) clearInterval(updateInterval);
    }
} 

// Start updates with safety check
async function startUpdatingRunwaySpacing() {
    if (updateInterval) clearInterval(updateInterval);

    try {
        await updateRunwaySpacingDisplay();
        updateInterval = setInterval(updateRunwaySpacingDisplay, 5000);
    } catch (error) {
        console.error("Error initializing updates:", error.message);
    }
}

// Start process
startUpdatingRunwaySpacing();

export { getRunwayAlignedAircraft, calculateRunwaySpacing, updateRunwaySpacingDisplay };