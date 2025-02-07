export const AIRPORTDB_URL = "https://infiniteflightapi.deno.dev/api/airport/";

// worldMap.js - Fetches world map GeoJSON data
export async function fetchWorldMap() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json");
        if (!response.ok) throw new Error("Failed to load world map");
        return await response.json();
    } catch (error) {
        console.error("Error loading GeoJSON:", error);
        return null;
    }
}