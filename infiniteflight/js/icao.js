export function setICAO(icao) {
    console.log("Storing ICAO:", icao);
    localStorage.setItem("icao", icao);
    sessionStorage.setItem("icao", icao);
}

export function getICAO() {
    return sessionStorage.getItem("icao") || localStorage.getItem("icao") || null;
}