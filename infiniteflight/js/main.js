import { getICAO } from "./icao.js";
import { inputSearch } from "./search.js";
import { getFlights, allFlights } from "./inbounds.js";

document.getElementById("icao").addEventListener("input", inputSearch);