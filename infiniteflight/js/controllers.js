// Fetch Controllers
async function fetchControllers(icao) {
    const cached = getCache(icao, 'controllers', cacheExpiration.controllers);
    if (cached) {
        displayControllers(cached); // Display cached controllers
        return cached;
    }

    try {
        const data = await fetchWithProxy(`/sessions/${SESSION_ID}/airport/${icao}/status`);
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