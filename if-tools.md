---
layout: page
---

<style>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  overflow-x: auto; /* Added for scrollable table on smaller screens */
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
th {
  background-color: #f4f4f4;
}
input, button {
  padding: 10px;
  margin: 10px;
}
button {
  cursor: pointer;
}
</style>

<h1>Inbound Flights Viewer</h1>
<label for="icaoCode">Enter ICAO Code:</label>
<input type="text" id="icaoCode" placeholder="e.g., EGLL">
<button id="fetchButton">Fetch Inbound Flights</button>

<table>
  <thead>
    <tr>
      <th>Flight ID</th>
      <th>Heading</th>
      <th>Altitude</th>
      <th>Ground Speed</th>
    </tr>
  </thead>
  <tbody id="flightsTableBody">
    <!-- Dynamic rows will go here -->
  </tbody>
</table>

<script>
const sessionId = "9bdfef34-f03b-4413-b8fa-c29949bb18f8";
const apiBaseUrl = "https://api.infiniteflight.com/public/v2";
const apiKey = "kqcfcn5ors95bzrdhzezbm9n9hnxq0qk";

document.getElementById("fetchButton").addEventListener("click", async () => {
  const icaoCode = document.getElementById("icaoCode").value.trim().toUpperCase();

  if (!/^[A-Z]{4}$/.test(icaoCode)) {
    alert("Please enter a valid 4-character ICAO code.");
    return;
  }

  try {
    const inboundResponse = await fetch(
      `${apiBaseUrl}/sessions/${sessionId}/airport/${icaoCode}/status`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!inboundResponse.ok) {
      throw new Error(`Failed to fetch airport status: ${inboundResponse.statusText}`);
    }

    const inboundData = await inboundResponse.json();
    console.log("Inbound Flights Response:", inboundData);

    const inboundFlights = inboundData.inboundFlights || [];
    if (inboundFlights.length === 0) {
      alert("No inbound flights found for this airport.");
      return;
    }

    const flightDetailsPromises = inboundFlights.map(async (flightId) => {
      try {
        const routeResponse = await fetch(
          `${apiBaseUrl}/sessions/${sessionId}/flights/${flightId}/route`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        if (!routeResponse.ok) {
          console.error(`Failed to fetch route for flight ${flightId}: ${routeResponse.statusText}`);
          return { flightId, heading: "N/A", altitude: "N/A", groundSpeed: "N/A" };
        }

        const routeData = await routeResponse.json();
        const lastRoutePoint = routeData.route?.[routeData.route.length - 1] || {};
        return {
          flightId,
          heading: lastRoutePoint?.heading || "N/A",
          altitude: lastRoutePoint?.altitude || "N/A",
          groundSpeed: lastRoutePoint?.groundSpeed || "N/A",
        };
      } catch (error) {
        console.error(`Error fetching flight ${flightId}:`, error);
        return { flightId, heading: "Error", altitude: "Error", groundSpeed: "Error" };
      }
    });

    const flightDetails = await Promise.all(flightDetailsPromises);
    updateTable(flightDetails);
  } catch (error) {
    console.error("Error fetching airport data:", error);
    alert("An error occurred while fetching data. Please try again.");
  }
});

function updateTable(flightDetails) {
  const tableBody = document.getElementById("flightsTableBody");
  tableBody.innerHTML = "";

  if (flightDetails.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4'>No flights available</td></tr>";
    return;
  }

  flightDetails.forEach((flight) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${flight.flightId}</td>
      <td>${flight.heading}</td>
      <td>${flight.altitude} ft</td>
      <td>${flight.groundSpeed} kts</td>
    `;
    tableBody.appendChild(row);
  });
}
</script>