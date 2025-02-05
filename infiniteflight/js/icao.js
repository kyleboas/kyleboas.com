// Function to store ICAO in sessionStorage
function setICAO(icao) {
    sessionStorage.setItem("icao", icao);
}

// Function to retrieve ICAO from sessionStorage
function getICAO() {
    return sessionStorage.getItem("icao") || null; // Returns null if not set
}

// Example Usage:
console.log(getICAO());

window.onload = function () {
    const savedICAO = getICAO();
    if (savedICAO) {
        console.log(`Restoring ICAO: ${savedICAO}`);
    }
};

function handleSearch() {
    const icaoInput = document.getElementById("icaoInput").value.trim().toUpperCase();

    if (!icaoInput) {
        alert("Please enter a valid ICAO code.");
        return;
    }

    setICAO(icaoInput); // Store ICAO in sessionStorage

    // Fetch runway data using the stored ICAO
    fetchRunwayData(icaoInput);
}