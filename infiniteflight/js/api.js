export const AIRPORTDB_URL = "https://infiniteflightapi.deno.dev/api/airport/";

export async function fetchSIGMET() {
    const url = "https://infiniteflightapi.deno.dev/api/sigmet";

    try {
        console.log(`Fetching SIGMETs from: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Error: ${response.status} - ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        console.log("Fetched SIGMET Data:", data);
        return data.features || [];
    } catch (error) {
        console.error("Error fetching SIGMET data:", error);
        return [];
    }
}