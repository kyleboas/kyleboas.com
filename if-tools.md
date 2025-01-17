---
layout: page
---


  <style>
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
    th { background-color: #f4f4f4; }
    input { margin: 0 10px; padding: 5px; }
    button { padding: 5px 10px; cursor: pointer; }
  </style>


  <div>
    <label for="icaoCode">ICAO Code:</label>
    <input type="text" id="icaoCode" placeholder="e.g., KATL">
    <label for="radius">Radius (km):</label>
    <input type="number" id="radius" placeholder="50" value="50">
    <br><br>
    <label for="minHeading">Min Heading:</label>
    <input type="number" id="minHeading" placeholder="0" value="0">
    <label for="maxHeading">Max Heading:</label>
    <input type="number" id="maxHeading" placeholder="360" value="360">
    <button id="filterButton">Filter</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>Callsign</th>
        <th>Heading</th>
        <th>GS</th>
        <th>Mach</th>
        <th>Aircraft</th>
        <th>Alt</th>
        <th>Dist.</th>
      </tr>
    </thead>
    <tbody id="flightTable"></tbody>
  </table>

  <script>
    const apiBaseUrl = "https://infiniteflight.com/api/live/v2"; // Replace with actual API base URL
    const apiKey = "${{ secrets.IF_API_KEY }}"; // Replace with your API key

    document.getElementById("filterButton").addEventListener("click", async () => {
      const icaoCode = document.getElementById("icaoCode").value.trim().toUpperCase();
      const radius = parseInt(document.getElementById("radius").value);
      const minHeading = parseInt(document.getElementById("minHeading").value);
      const maxHeading = parseInt(document.getElementById("maxHeading").value);

      if (!icaoCode) {
        alert("Please enter a valid ICAO code.");
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/flights`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) throw new Error("Failed to fetch flight data.");

        const flights = await response.json();
        const filteredFlights = flights.filter((flight) => {
          return (
            flight.destination === icaoCode &&
            flight.distance < radius &&
            flight.heading >= minHeading &&
            flight.heading <= maxHeading
          );
        });

        renderTable(filteredFlights);
      } catch (error) {
        console.error("Error fetching flights:", error);
        alert("Error fetching flight data. Check the console for details.");
      }
    });

    function renderTable(flights) {
      const tableBody = document.getElementById("flightTable");
      tableBody.innerHTML = "";

      flights.forEach((flight) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${flight.callsign}</td>
          <td>${flight.heading}</td>
          <td>${flight.groundSpeed}</td>
          <td>${flight.mach}</td>
          <td>${flight.aircraftType}</td>
          <td>${flight.altitude}</td>
          <td>${flight.distance.toFixed(2)}</td>
        `;

        tableBody.appendChild(row);
      });
    }
  </script>
