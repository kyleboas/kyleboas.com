// Store ICAO in sessionStorage
export function setICAO(icao) {
    console.log("Storing ICAO:", icao);
    sessionStorage.setItem("icao", icao);
}

// Retrieve ICAO from sessionStorage
export function getICAO() {
    const icao = sessionStorage.getItem("icao") || null;
    console.log("Retrieving ICAO:", icao);
    return icao;
}