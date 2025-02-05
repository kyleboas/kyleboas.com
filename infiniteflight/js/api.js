const API_KEY = "YOUR_API_KEY";

// Fetch runways dynamically based on ICAO code
async function fetchRunwayData(icao) {
    const url = `https://airportdb.io/api/v1/airport/${icao}?apiKey=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch runway data");
        
        const data = await response.json();
        return data.runways || [];
    } catch (error) {
        console.error("Error fetching runways:", error);
        return [];
    }
}

// Export the function for use in other files
export { fetchRunwayData };