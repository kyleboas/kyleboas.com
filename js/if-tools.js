const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8'; // Replace with the correct session ID
const API_KEY = 'kqcfcn5ors95bzrdhzezbm9n9hnxq0qk'; // Replace with your Infinite Flight API Key

// Function to fetch inbound flight IDs
async function fetchInboundFlightIds(icao) {
    const url = `${API_BASE_URL}/sessions/${SESSION_ID}/airport/${icao}/status`;

    try {
        const options = {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        // Debug: Log the request and headers
        console.log('Fetching URL:', url);
        console.log('Headers:', options.headers);

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`Error fetching inbound flights: ${response.status}`);
        }

        const data = await response.json();
        return data.result.inboundFlights || [];
    } catch (error) {
        console.error('Error in fetchInboundFlightIds:', error.message);
        alert('Failed to fetch inbound flight IDs.');
        return [];
    }
}

// Function to fetch all flights and filter by inbound flight IDs
async function fetchInboundFlightDetails(inboundFlightIds) {
    const url = `${API_BASE_URL}/sessions/${SESSION_ID}/flights`;

    try {
        const options = {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        // Debug: Log the request and headers
        console.log('Fetching URL:', url);
        console.log('Headers:', options.headers);

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`Error fetching flight details: ${response.status}`);
        }

        const data = await response.json();
        return data.result.filter(flight => inboundFlightIds.includes(flight.id));
    } catch (error) {
        console.error('Error in fetchInboundFlightDetails:', error.message);
        alert('Failed to fetch flight details.');
        return [];
    }
}

// Test the headers and response by submitting the form
document.getElementById('searchForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const icao = document.getElementById('icao').value.trim().toUpperCase();
    if (!icao) {
        alert('Please enter a valid ICAO code.');
        return;
    }

    try {
        // Fetch inbound flight IDs
        const inboundFlightIds = await fetchInboundFlightIds(icao);

        if (inboundFlightIds.length === 0) {
            alert('No inbound flights found for this airport.');
            return;
        }

        // Fetch and filter flight details
        const flights = await fetchInboundFlightDetails(inboundFlightIds);
        console.log('Fetched Flights:', flights);
    } catch (error) {
        console.error('Error:', error.message);
        alert('An error occurred while fetching flight data.');
    }
});