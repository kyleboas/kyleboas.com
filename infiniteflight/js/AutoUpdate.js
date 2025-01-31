import { fetchAndUpdateFlights } from "./flights.js";
import { fetchControllers, fetchActiveATCAirports } from "./ATC.js";
import { renderATCTable } from "./atcTable.js";


let isAutoUpdateActive = false;
let flightUpdateInterval = null;
let interpolateInterval = null;
let atcUpdateInterval = null;

export function startAutoUpdate(icao, updateButton) {
    isAutoUpdateActive = true;
    updateButton.style.color = "blue";
    const icon = updateButton.querySelector("i");
    if (icon) icon.classList.add("spin");

    interpolateInterval = setInterval(async () => {
        try {
            interpolateNextPositions(airportCoordinates);
        } catch (error) {
            console.error("Error during interpolated flight updates:", error.message);
            handleUpdateError(error, flightUpdateInterval);
        }
    }, 1000); // Updates every second

    flightUpdateInterval = setInterval(async () => {
        try {
            await fetchAndUpdateFlights(icao);
        } catch (error) {
            console.error("Error fetching flight updates:", error.message);
            handleUpdateError(error, flightUpdateInterval);
        }
    }, 18000); // API updates every 18 seconds

    atcUpdateInterval = setInterval(async () => {
        try {
            await fetchControllers(icao);
            await fetchActiveATCAirports();
            await renderATCTable();
        } catch (error) {
            console.error("Error during ATC updates:", error.message);
            handleUpdateError(error, atcUpdateInterval);
        }
    }, 60000);
}

export function stopAutoUpdate(updateButton) {
    isAutoUpdateActive = false;
    updateButton.style.color = "#828282";
    const icon = updateButton.querySelector("i");
    if (icon) icon.classList.remove("spin");

    clearInterval(flightUpdateInterval);
    clearInterval(interpolateInterval);
    clearInterval(atcUpdateInterval);

    flightUpdateInterval = null;
    interpolateInterval = null;
    atcUpdateInterval = null;

    console.log("Auto-update and interpolation stopped.");
}

function handleUpdateError(error, interval) {
    if (error.message.includes("rate limit") || error.message.includes("fetch")) {
        alert("Rate limit or network error encountered. Updates stopped.");
        clearInterval(interval);
    }
}