// Fetch ATIS
async function fetchAirportATIS(icao) {
    const atisElement = document.getElementById('atisMessage');

    const cached = getCache(icao, 'atis', cacheExpiration.atis);
    if (cached) {
        displayATIS(cached); // Display cached ATIS
        return cached;
    }

    try {
        const data = await fetchATISData;
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