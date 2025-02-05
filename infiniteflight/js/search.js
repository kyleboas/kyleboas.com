import { setICAO } from "./icao.js";

function inputSearch() {
    const inputElement = document.getElementById("icao");
    
    if (!inputElement) {
        console.error("ICAO input field not found.");
        return;
    }

    const inputICAO = inputElement.value.trim().toUpperCase();
    
    if (inputICAO.length === 4) {
        setICAO(inputICAO);
        console.log(`ICAO stored: ${inputICAO}`);
    }
}

export { inputSearch };