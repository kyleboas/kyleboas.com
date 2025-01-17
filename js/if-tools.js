// Base URL for Infinite Flight API
const API_BASE_URL = 'https://api.infiniteflight.com/public/v2';

// Function to fetch flight data
async function fetchFlights(icao) {
    const apiKey = 'kqcfcn5ors95bzrdhzezbm9n9hnxq0qk';
    const url = `${API_BASE_URL}/airport/${icao}/arrivals`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.result || [];
    } catch (error) {
        console.error(error.message);
        alert('Error fetching data. Please try again.');
        return [];
    }
}

// Function to render flight data into the table
function renderFlightsTable(flights) {
    const tableBody = document.querySelector('#flightsTable tbody');
    tableBody.innerHTML = ''; // Clear previous results

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

    const flights = await fetchFlights(icao);
    renderFlightsTable(flights);
});