export const AIRPORTDB_URL = "https://infiniteflightapi.deno.dev/api/airport/";

// worldMap.js - Fetches world map GeoJSON data
// sigmetData.js - Fetches and exports SIGMET data

export async function fetchSIGMET() {
    try {
        const response = await fetch("https://aviationweather.gov/api/data/isigmet?format=json&hazard=turb");
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const data = await response.json();

        console.log("Fetched SIGMET Data:", data);
        return data;
    } catch (error) {
        console.error("Error fetching SIGMET data:", error);
        return null;
    }
}