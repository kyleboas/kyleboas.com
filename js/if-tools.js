// API key for Infinite Flight Live API
const apiKey = "API_KEY";

// Fetch all flights from the API
async function fetchFlights() {
  const response = await fetch("https://api.infiniteflight.com/v1/flights", {
    headers: {
      "Authorization": `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    console.error("Error fetching flights:", response.status);
    return [];
  }
  
  const data = await response.json();
  return data.result || [];
}

// Filter flights by heading
function filterFlightsByHeading(flights, minHeading, maxHeading) {
  return flights.filter(flight =>
    flight.heading >= minHeading && flight.heading <= maxHeading
  );
}

// Render flights into the table
function renderFlights(flights) {
  const flightTable = document.getElementById("flightTable");
  flightTable.innerHTML = ""; // Clear previous data
  
  flights.forEach(flight => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${flight.callsign || "N/A"}</td>
      <td>${flight.latitude.toFixed(2)}</td>
      <td>${flight.longitude.toFixed(2)}</td>
      <td>${flight.heading.toFixed(0)}</td>
    `;
    flightTable.appendChild(row);
  });
}

// Update flights with filtering
async function updateFlights() {
  const minHeading = parseFloat(document.getElementById("minHeading").value) || 0;
  const maxHeading = parseFloat(document.getElementById("maxHeading").value) || 360;

  const flights = await fetchFlights();
  const filteredFlights = filterFlightsByHeading(flights, minHeading, maxHeading);
  renderFlights(filteredFlights);
}

// Add event listener to the filter button
document.getElementById("filterButton").addEventListener("click", updateFlights);

// Auto-refresh every 30 seconds
setInterval(updateFlights, 30000);

// Initial load
updateFlights();