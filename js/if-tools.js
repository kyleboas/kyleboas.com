const API_BASE = "https://api.infiniteflight.com/public/v2";

// Replace with your API key
const API_KEY = "api-key";

async function fetchData(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Authorization": `Bearer ${API_KEY}` }
  });
  return response.json();
}

function calculateUptime(timeOpened) {
  const openedTime = new Date(timeOpened).getTime();
  const currentTime = Date.now();
  return Math.round((currentTime - openedTime) / 60000); // Uptime in minutes
}

async function loadActiveATC() {
  const atcData = await fetchData("/atc");
  const groupedATC = new Map();

  // Group ATC data by airport
  atcData.forEach(atc => {
    if (!groupedATC.has(atc.airport)) {
      groupedATC.set(atc.airport, []);
    }
    groupedATC.get(atc.airport).push({
      frequency: atc.frequency,
      type: atc.type,
      uptime: calculateUptime(atc.timeOpened)
    });
  });

  const tableBody = document.querySelector("#atcTable tbody");
  tableBody.innerHTML = "";

  groupedATC.forEach((frequencies, airport) => {
    // Add a header row for the airport
    const airportRow = document.createElement("tr");
    airportRow.className = "group-row";
    airportRow.innerHTML = `<td colspan="4">${airport}</td>`;
    tableBody.appendChild(airportRow);

    // Add rows for each frequency at this airport
    frequencies.forEach(freq => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td></td> <!-- Blank cell for airport grouping -->
        <td>${freq.frequency}</td>
        <td>${freq.type}</td>
        <td>${freq.uptime}</td>
      `;
      tableBody.appendChild(row);
    });
  });
}

async function loadInboundFlights() {
  const flightsData = await fetchData("/flights");
  const airports = {};

  flightsData.forEach(flight => {
    if (flight.arrivalAirport && flight.timeToDestination) {
      if (!airports[flight.arrivalAirport]) {
        airports[flight.arrivalAirport] = [];
      }
      airports[flight.arrivalAirport].push(flight.timeToDestination);
    }
  });

  const sortedAirports = Object.entries(airports).map(([airport, times]) => {
    const avgETA = Math.min(...times);
    return { airport, count: times.length, eta: Math.round(avgETA / 60) };
  }).sort((a, b) => a.eta - b.eta);

  const tableBody = document.querySelector("#inboundsTable tbody");
  tableBody.innerHTML = "";

  sortedAirports.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.airport}</td>
      <td>${entry.count}</td>
      <td>${entry.eta}</td>
    `;
    tableBody.appendChild(row);
  });
}

async function init() {
  await loadActiveATC();
  await loadInboundFlights();
}

init();