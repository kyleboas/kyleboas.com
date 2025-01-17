---
layout: page
---



  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      padding: 0;
    }
    label, input, button {
      margin: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
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
    }
    button {
      cursor: pointer;
    }
  </style>

  <h1>Airport Traffic Viewer</h1>
  <label for="icaoCode">Enter ICAO Code:</label>
  <input type="text" id="icaoCode" placeholder="e.g., EGLL" />
  <button id="searchButton">Search</button>

  <table id="trafficTable">
    <thead>
      <tr>
        <th>Callsign</th>
        <th>Altitude</th>
        <th>Speed (kts)</th>
        <th>Heading</th>
        <th>Aircraft</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <!-- Dynamic rows go here -->
    </tbody>
  </table>

  <script>
    const apiBaseUrl = "https://api.infiniteflight.com/live/v2"; // Replace with actual API URL
    const apiKey = "${{ secrets.IF_API_KEY }}"; // Replace with your API key

    document.getElementById("searchButton").addEventListener("click", async () => {
      const icaoCode = document.getElementById("icaoCode").value.trim().toUpperCase();

      if (!icaoCode) {
        alert("Please enter a valid ICAO code.");
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/airport-status?icao=${icaoCode}`, {
          headers: { Authorization: Bearer ${apiKey} },
        });

        if (!response.ok) {
          alert(`Failed to fetch data for ${icaoCode}.`);
          return;
        }

        const data = await response.json();
        updateTrafficTable(data);
      } catch (error) {
        console.error("Error fetching airport traffic:", error);
        alert("An error occurred. Check the console for details.");
      }
    });

    function updateTrafficTable(data) {
      const tableBody = document.querySelector("#trafficTable tbody");
      tableBody.innerHTML = ""; // Clear previous data

      data.flights.forEach((flight) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${flight.callsign || "N/A"}</td>
          <td>${flight.altitude || 0} ft</td>
          <td>${flight.groundSpeed || 0} kts</td>
          <td>${flight.heading || 0}</td>
          <td>${flight.aircraftType || "Unknown"}</td>
          <td>${flight.status || "Unknown"}</td>
        `;

        tableBody.appendChild(row);
      });
    }
  </script>