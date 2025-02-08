export const AIRPORTDB_URL = "https://infiniteflightapi.deno.dev/api/airport/";

// worldMap.js - Fetches world map GeoJSON data
export async function fetchWorldMap() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json");
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json(); // Ensure proper JSON parsing
        return data;
    } catch (error) {
        console.error("Error fetching world map:", error);
        return null;
    }
}