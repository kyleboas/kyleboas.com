async function handleSearch() {
        const icao = icaoInput.value.trim().toUpperCase();

        if (!icao) {
            alert("Please enter a valid ICAO code.");
            return;
        }

        stopAutoUpdate();
        allFlights = [];
        interpolatedFlights = [];
        airportCoordinates = null;
        lastApiUpdateTime = null;

        const tableBody = document.querySelector("#flightsTable tbody");
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
        }

        try {
            airportCoordinates = await fetchAirportCoordinates(icao);
            if (!airportCoordinates) {
                throw new Error("Failed to fetch airport coordinates.");
            }
            
            await fetchAndUpdateFlights(icao);
            updateAircraftOnMap(allFlights, airportCoordinates);
            startAutoUpdate(icao);
        } catch (error) {
            console.error("Error during search:", error.message);
            alert("Failed to fetch and update flights. Please try again.");
        }
    }

 