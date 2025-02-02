export const cache = {
    airportCoordinates: {},
    inboundFlightIds: {},
    atis: {},
    controllers: {},
};

export const cacheExpiration = {
    airportCoordinates: 90 * 24 * 60 * 60 * 1000, // 90 days
    inboundFlightIds: 5 * 60 * 1000, // 5 minutes
    atis: 30 * 60 * 1000, // 30 minutes
    controllers: 10 * 60 * 1000, // 10 minutes
};

export function setCache(key, value, type) {
    cache[type][key] = { value, timestamp: Date.now() };
}

export function getCache(key, type, expiration) {
    const entry = cache[type][key];
    if (!entry) return null;

    // Check expiration
    if (Date.now() - entry.timestamp > expiration) {
        delete cache[type][key]; // Remove expired entry
        return null;
    }
    return entry.value;
}

export function getUncachedIds(ids, type) {
    return ids.filter(id => !cache[type][id]);
}