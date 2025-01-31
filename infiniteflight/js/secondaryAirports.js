import { fetchATISData } from "./api.js";

// Fetch ATIS for secondary airports using shared cache
export async function fetchSecondaryATIS(icao) {
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
export async function fetchSecondaryControllers(icao) {
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