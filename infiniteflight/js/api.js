export const AIRPORTDB_URL = "https://infiniteflightapi.deno.dev/api/airport/";

function getCurrentUTCDate() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const hours = String(now.getUTCHours()).padStart(2, "0");
    const minutes = String(now.getUTCMinutes()).padStart(2, "0");
    const seconds = String(now.getUTCSeconds()).padStart(2, "0");

    return `${year}${month}${day}_${hours}${minutes}${seconds}Z`;
}

export async function fetchSIGMET() {
    const dateParam = getCurrentUTCDate();
    const url = `https://aviationweather.gov/api/data/isigmet?format=json&hazard=turb&date=${dateParam}`;

    try {
        console.log(`Fetching SIGMETs from: ${url}`);
        const response = await fetch(url, {
            headers: { "Accept": "*/*" }
        });

        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const data = await response.json();

        console.log("Fetched SIGMET Data:", data);
        return data.features || []; // Ensure we return an array
    } catch (error) {
        console.error("Error fetching SIGMET data:", error);
        return [];
    }
}