export const AIRPORTDB_URL = "https://infiniteflightapi.deno.dev/api/airport/";

export async function fetchSIGMET() {
    const url = "https://infiniteflightapi.deno.dev/api/sigmet"; // Change to your API URL

    try {
        console.log(`Fetching SIGMETs from: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Error: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error("Invalid SIGMET data format:", data);
            return [];
        }

        // Convert SIGMETs to GeoJSON FeatureCollection
        const sigmetGeoJSON = {
            type: "FeatureCollection",
            features: data.map(sigmet => ({
                type: "Feature",
                properties: {
                    fir: sigmet.firName,
                    hazard: sigmet.hazard,
                    base: sigmet.base,
                    top: sigmet.top,
                    speed: sigmet.spd,
                    movement: sigmet.dir,
                    raw: sigmet.rawSigmet
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [sigmet.coords.map(coord => [coord.lon, coord.lat])]
                }
            }))
        };

        console.log("Formatted SIGMET Data:", sigmetGeoJSON);
        return sigmetGeoJSON.features; // Return as a GeoJSON features array
    } catch (error) {
        console.error("Error fetching SIGMET data:", error);
        return [];
    }
}