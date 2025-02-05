import { setICAO } from "./icao.js";

async function inputSearch() {
    const inputICAO = icaoInput.value.trim().toUpperCase();
    
    setICAO(inputICAO);
}

export { inputSearch };