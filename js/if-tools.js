const apiKey = "${{ secrets.IF_API_KEY }}";

// Fetch all flights from the Infinite Flight API
async function fetchFlights() {
  const response = await fetch("https://api.infiniteflight.com/v1/flights", {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  if (!response.ok) {
    console.error("Error fetching flights:", response.status);
    return [];
  }
  const data = await response.json();
  return data.result || [];
}

// Fetch airport data by ICAO code
async function fetchAirportByICAO(icaoCode) {
  const response = await fetch(`https://api.infiniteflight.com/v1/airports/${icaoCode}`, {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  if (!response.ok) {
    console.error("Error fetching airport data:", response.status);
    return null;
  }
  const data = await response.json();
  return data.result || null;
}

// Calculate distance between two geographic points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Convert knots to Mach speed (approximate calculation)
function convertKnotsToMach(knots) {
  const speedOfSound = 661.47; // Speed of sound in knots at sea level (standard conditions)
  return knots / speedOfSound;
}

// Filter flights based on proximity to an airport and heading range
function filterFlights(flights, airportLat, airportLon, radius, minHeading, maxHeading) {
  return flights.map(flight => {
    const distance = calculateDistance(
      flight.latitude, flight.longitude, airportLat, airportLon
    );
    const machSpeed = convertKnotsToMach(flight.groundspeed || 0);
    return { ...flight, distance, machSpeed };
  }).filter(flight =>
    flight.distance <= radius &&
    flight.heading >= minHeading &&
    flight.heading <= maxHeading
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
      <td>${flight.heading.toFixed(0)}</td>
      <td>${flight.groundspeed || 0}</td>
      <td>${flight.machSpeed.toFixed(3)}</td>
      <td>${flight.aircraftId || "N/A"}</td>
      <td>${flight.altitude || 0}</td>
      <td>${flight.distance.toFixed(2)}</td>
    `;
    flightTable.appendChild(row);
  });
}

// Update flights based on user inputs
async function updateFlights() {
  const icaoCode = document.getElementById("icaoCode").value.toUpperCase();
  const radius = parseFloat(document.getElementById("radius").value) || 50;
  const minHeading = parseFloat(document.getElementById("minHeading").value) || 0;
  const maxHeading = parseFloat(document.getElementById("maxHeading").value) || 360;

  if (!icaoCode) {
    alert("Please enter a valid ICAO code.");
    return;
  }

  // Fetch airport data
  const airport = await fetchAirportByICAO(icaoCode);
  if (!airport) {
    alert(`No data found for ICAO code: ${icaoCode}`);
    return;
  }

  const { latitude: airportLat, longitude: airportLon } = airport;

  // Fetch flights and filter them
  const flights = await fetchFlights();
  const filteredFlights = filterFlights(flights, airportLat, airportLon, radius, minHeading, maxHeading);

  // Render the filtered flights
  renderFlights(filteredFlights);
}

// Add event listener to the filter button
document.getElementById("filterButton").addEventListener("click", updateFlights);

// Initial empty render
renderFlights([]);