// Cookie Management
export function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

export function getCookie(name) {
    const cookies = document.cookie.split('; ');
    const cookie = cookies.find(c => c.startsWith(`${name}=`));
    return cookie ? cookie.split('=')[1] : null;
}

// Cache Management
export const cache = {
    airportCoordinates: {},
    inboundFlightIds: {},
    atis: {},
    controllers: {},
};

export const cacheExpiration = {
    airportCoordinates: 90 * 24 * 60 * 60 * 1000,
    inboundFlightIds: 5 * 60 * 1000,
    atis: 30 * 60 * 1000,
    controllers: 10 * 60 * 1000,
};

export function setCache(key, value, type) {
    cache[type][key] = { value, timestamp: Date.now() };
}

export function getCache(key, type, expiration) {
    const entry = cache[type][key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > expiration) {
        delete cache[type][key];
        return null;
    }
    return entry.value;
}