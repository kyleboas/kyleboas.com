// Fetch Controllers
async function fetchControllers(icao) {
    const cached = getCache(icao, 'controllers', cacheExpiration.controllers);
    if (cached) {
        displayControllers(cached); // Display cached controllers
        return cached;
    }

    try {
        const data = await fetchStatusData();
        const controllers = (data.result.atcFacilities || [])
            .map(facility => {
                const frequencyTypes = {
                    0: "Ground",
                    1: "Tower",
                    2: "Unicom",
                    3: "Clearance",
                    4: "Approach",
                    5: "Departure",
                    6: "Center", // Center frequency
                    7: "ATIS",
                };
                const frequencyName = frequencyTypes[facility.type] || "Unknown";
                return { frequencyName, username: facility.username, type: facility.type };
            });

        // Sort controllers by a specific order
        const sortedControllers = controllers.sort((a, b) => {
            const order = ["ATIS", "Clearance", "Ground", "Tower", "Approach", "Departure", "Center", "Unknown"];
            const indexA = order.indexOf(a.frequencyName);
            const indexB = order.indexOf(b.frequencyName);
            return indexA - indexB;
        }).map(ctrl => `${ctrl.frequencyName}: ${ctrl.username}`);

        // Extract only Center frequencies
        const centerFrequencies = controllers
            .filter(ctrl => ctrl.frequencyName === "Center")
            .map(ctrl => `${ctrl.frequencyName}: ${ctrl.username}`);

        setCache(icao, sortedControllers, 'controllers');
        displayControllers(sortedControllers, centerFrequencies); // Pass both sorted controllers and centers
        return sortedControllers;
    } catch (error) {
        console.error('Error fetching controllers:', error.message);
        displayControllers(['No active controllers available'], []);
        return [];
    }
}

// Fetch ATIS
async function fetchAirportATIS(icao) {
    const atisElement = document.getElementById('atisMessage');

    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) {
        displayATIS(cached); // Display cached ATIS
        return cached;
    }

    try {
        const data = await fetchATISData();
        const atis = data.result || 'ATIS not available'; // Use `data.result`
        setCache(icao, atis, 'atis');
        displayATIS(atis); // Display fetched ATIS
        return atis;
    } catch (error) {
        console.error('Error fetching ATIS:', error.message);
        displayATIS('ATIS not available');
        return 'ATIS not available';
    }
}

// Display ATIS
function displayATIS(atis) {
    const atisElement = document.getElementById('atisMessage');
    const mainAirportElement = document.querySelector('.mainAirport');

    if (!atisElement || !mainAirportElement) {
        console.error('ATIS display element or mainAirport element not found.');
        return;
    }

    // Ensure the main airport section is visible
    mainAirportElement.style.display = 'block';

    // Update the ATIS content
    atisElement.style.display = 'block';
    atisElement.textContent = `ATIS: ${atis || 'Not available'}`;
}

function displayControllers(controllers, centerFrequencies = []) {
    const controllersElement = document.getElementById('controllersList');
    const mainAirportElement = document.querySelector('.mainAirport');

    if (!controllersElement || !mainAirportElement) {
        console.error('Controllers display element or mainAirport element not found.');
        return;
    }

    // Ensure the main airport section is visible
    mainAirportElement.style.display = 'block';

    // Separate Center frequencies and other controllers
    const otherControllers = controllers.length
        ? controllers.filter(ctrl => !centerFrequencies.includes(ctrl)).map(ctrl => `${ctrl}<br>`).join('')
        : 'No active controllers available.';

    const centerControllers = centerFrequencies.length
        ? centerFrequencies.map(ctrl => `${ctrl}<br>`).join('')
        : 'No active Center frequencies available.';

    // Combine other controllers first, followed by Center frequencies
    controllersElement.style.display = 'block';
    controllersElement.innerHTML = `
        <p>${otherControllers}</p>
        <p>${centerControllers}</p>
    `;
}