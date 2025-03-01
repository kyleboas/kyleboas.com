import { fetchAirportCoordinates } from "./inbounds.js";

export async function plotAirport(icao, ctx, projection) {
    if (!icao) {
        console.error("No ICAO code provided.");
        return;
    }

    const coordinates = await fetchAirportCoordinates(icao);
    if (!coordinates) {
        console.error("Invalid airport coordinates.");
        return;
    }

    // Convert latitude/longitude to canvas coordinates
    const [x, y] = projection([coordinates.longitude, coordinates.latitude]);

    // Draw the airport dot
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();

    console.log(`Airport ${icao} plotted at (${x}, ${y}).`);
}