import { 
        fetchAndUpdateFlights,
        interpolateNextPositions,
        fetchControllers,
        fetchActiveATCAirports,
        renderATCTable 
 } from "./inbounds-test.js";

export class AutoUpdate {
    constructor(fetchAndUpdateFlights, interpolateNextPositions, fetchControllers, fetchActiveATCAirports, renderATCTable) {
        const updateButton = document.getElementById("update")
        this.fetchFlights = fetchFlights;
        this.interpolateNextPositions = interpolateNextPositions;
        this.fetchControllers = fetchControllers;
        this.fetchActiveATCAirports = fetchActiveATCAirports;
        this.renderATCTable = renderATCTable;

        this.isAutoUpdateActive = false;
        this.flightUpdateInterval = null;
        this.interpolateInterval = null;
        this.atcUpdateInterval = null;
    }

    start(icao) {
        this.isAutoUpdateActive = true;
        this.updateButton.style.color = "blue";
        const icon = this.updateButton.querySelector("i");
        if (icon) icon.classList.add("spin");

        this.interpolateInterval = setInterval(() => {
            try {
                this.interpolate();
            } catch (error) {
                console.error("Interpolation error:", error);
            }
        }, 1000);

        this.flightUpdateInterval = setInterval(async () => {
            try {
                await this.fetchFlights(icao);
            } catch (error) {
                console.error("Flight update error:", error);
                this.stop();
            }
        }, 18000);

        this.atcUpdateInterval = setInterval(async () => {
            try {
                await this.fetchControllers(icao);
                await this.fetchATC();
                await this.renderATC();
            } catch (error) {
                console.error("ATC update error:", error);
                this.stop();
            }
        }, 60000);
    }

    stop() {
        this.isAutoUpdateActive = false;
        this.updateButton.style.color = "#828282";
        const icon = this.updateButton.querySelector("i");
        if (icon) icon.classList.remove("spin");

        clearInterval(this.flightUpdateInterval);
        clearInterval(this.interpolateInterval);
        clearInterval(this.atcUpdateInterval);

        console.log("Auto-update stopped.");
    }
}