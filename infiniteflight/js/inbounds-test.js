import { pairAircraftData } from "./aircraft.js";


function getFlights() {
    return allFlights && allFlights.length > 0 ? allFlights : interpolatedFlights;
}