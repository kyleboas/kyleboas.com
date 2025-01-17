const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';
const SESSION_ID = '9bdfef34-f03b-4413-b8fa-c29949bb18f8'; // Replace with the correct session ID
const API_KEY = 'kqcfcn5ors95bzrdhzezbm9n9hnxq0qk'; // Replace with your Infinite Flight API Key

// Function to fetch inbound flight IDs
async function fetchInboundFlightIds(icao) {
    const url = `${API_BASE_URL}/sessions/${SESSION_ID}/airport/${icao}/status`;

    try {
        const options = {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        };

        console.log('Request Headers:', options.headers); // Log headers for debugging

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
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        };

        console.log('Request Headers:', options.headers); // Log headers for debugging

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

// Function to render flight details in the table
function renderFlightsTable(flights) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = '';

    if (flights.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No inbound flights found.</td></tr>';
        return;
    }

    flights.forEach(flight => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${flight.heading}</td>
            <td>${flight.groundSpeed}</td>
            <td>${(flight.groundSpeed / 666.739).toFixed(2)}</td>
            <td>${flight.altitude}</td>
            <td>${flight.distanceToDestination.toFixed(2)}</td>
            <td>${Math.round(flight.estimatedTimeEnroute / 60)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Form submission handler
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
            renderFlightsTable([]);
            return;
        }

        // Fetch and filter flight details
        const flights = await fetchInboundFlightDetails(inboundFlightIds);
        renderFlightsTable(flights);
    } catch (error) {
        console.error('Error:', error.message);
        alert('An error occurred while fetching flight data.');
    }
});