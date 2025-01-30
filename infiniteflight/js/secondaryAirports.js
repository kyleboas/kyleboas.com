
import { fetchATISData } from "./api.js";

// Fetch ATIS for secondary airports using shared cache
async function fetchSecondaryATIS(icao) {
    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) {
        return cached;
    }

    try {
        const data = await fetchATISData;
        const atis = data.result || 'ATIS not available';
        setCache(icao, atis, 'atis');
        return atis;
    } catch (error) {
        console.error(`Error fetching ATIS for secondary airport ${icao}:`, error.message);
        return 'ATIS not available';
    }
}

// Fetch controllers for secondary airports using shared cache
async function fetchSecondaryControllers(icao) {
    const cached = getCache(icao, 'controllers', cacheExpiration.controllers);
    if (cached) {
        return cached;
    }

    try {
        const data = await fetchStatus;
        const controllers = (data.result.atcFacilities || [])
            .map(facility => {
                const frequencyTypes = {
                    0: "Ground",
                    1: "Tower",
                    2: "Unicom",
                    3: "Clearance",
                    4: "Approach",
                    5: "Departure",
                    6: "Center",
                    7: "ATIS",
                };
                const frequencyName = frequencyTypes[facility.type] || "Unknown";
                return `${frequencyName}: ${facility.username}`;
            });
        setCache(icao, controllers, 'controllers');
        return controllers;
    } catch (error) {
        console.error(`Error fetching controllers for secondary airport ${icao}:`, error.message);
        return [];
    }
}
 
// Add secondary airport to the display
document.getElementById('add').addEventListener('click', async (event) => {
    event.preventDefault();
    const secondaryIcao = document.getElementById('icao').value.trim().toUpperCase();

    if (!secondaryIcao) {
        alert('Please enter a valid ICAO code.');
        return;
    }

    // Prevent duplicate secondary airports
    if (document.getElementById(`secondary-${secondaryIcao}`)) {
        alert('This airport is already added.');
        return;
    }

    try {
        const secondaryAirportContainer = document.getElementById('secondaryAirportContainer');
        const airportDiv = document.createElement('div');
        airportDiv.id = `secondary-${secondaryIcao}`;
        airportDiv.className = 'secondaryAirport';
        airportDiv.innerHTML = `
            <p><strong>${secondaryIcao}</strong></p>
            <p class="secondary-atis" id="secondary-${secondaryIcao}-atis"></p>
            <p class="secondary-controllers" id="secondary-${secondaryIcao}-controllers"></p>
            <button type="button" class="removeAirportButton" data-icao="${secondaryIcao}">Remove</button>
        `;
        secondaryAirportContainer.appendChild(airportDiv);

        // Fetch ATIS and controllers for the secondary airport
        const atis = await fetchSecondaryATIS(secondaryIcao);
        const controllers = await fetchSecondaryControllers(secondaryIcao);

        // Display ATIS
        const atisElement = document.getElementById(`secondary-${secondaryIcao}-atis`);
        atisElement.textContent = `ATIS: ${atis || 'Not available'}`;

        // Display controllers
        const controllersElement = document.getElementById(`secondary-${secondaryIcao}-controllers`);
        controllersElement.innerHTML = controllers.length
            ? controllers.map(ctrl => `${ctrl}<br>`).join('')
            : 'No active controllers available.';
    } catch (error) {
        console.error(`Error fetching data for secondary airport ${secondaryIcao}:`, error.message);
        alert(`Failed to fetch data for the secondary airport: ${secondaryIcao}`);
    }
});

// Event delegation for dynamically added "Remove" buttons
document.getElementById('secondaryAirportContainer').addEventListener('click', (event) => {
    if (event.target.classList.contains('removeAirportButton')) {
        const icao = event.target.getAttribute('data-icao');
        const airportDiv = document.getElementById(`secondary-${icao}`);

        if (airportDiv) {
            airportDiv.remove();
            console.log(`Removed secondary airport: ${icao}`);
        } else {
            console.warn(`Airport div not found for ICAO: ${icao}`);
        }
    }
});