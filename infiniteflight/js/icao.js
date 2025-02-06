// Store ICAO in sessionStorage
export function setICAO(icao) {
    sessionStorage.setItem("icao", icao);
}

// Retrieve ICAO from sessionStorage
export function getICAO() {
    return sessionStorage.getItem("icao") || null;
}