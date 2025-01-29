

export class autoUpdate {
    constructor(updateButton, fetchAndUpdateFlights, interpolateNextPositions, fetchControllers, fetchActiveATCAirports, renderATCTable) {
        this.updateButton = updateButton;
        this.fetchAndUpdateFlights = fetchAndUpdateFlights;
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
        if (this.isAutoUpdateActive) return; // Prevent duplicate intervals
        this.isAutoUpdateActive = true;
        this._updateButtonState(true);

        this.interpolateInterval = setInterval(() => {
            try {
                this.interpolateNextPositions();
            } catch (error) {
                console.error("Error during flight interpolation:", error.message);
                this._handleNetworkError(error, 'interpolation');
            }
        }, 1000); // Runs every second

        this.flightUpdateInterval = setInterval(async () => {
            try {
                await this.fetchAndUpdateFlights(icao);
            } catch (error) {
                console.error("Error during flight updates:", error.message);
                this._handleNetworkError(error, 'flight update');
            }
        }, 18000); // API updates every 18 seconds

        this.atcUpdateInterval = setInterval(async () => {
            try {
                await this.fetchControllers(icao);
                await this.fetchActiveATCAirports();
                await this.renderATCTable();
            } catch (error) {
                console.error("Error during ATC updates:", error.message);
                this._handleNetworkError(error, 'ATC update');
            }
        }, 60000); // ATC updates every 60 seconds
    }

    stop() {
        if (!this.isAutoUpdateActive) return;

        this.isAutoUpdateActive = false;
        this._updateButtonState(false);

        clearInterval(this.flightUpdateInterval);
        clearInterval(this.interpolateInterval);
        clearInterval(this.atcUpdateInterval);

        this.flightUpdateInterval = null;
        this.interpolateInterval = null;
        this.atcUpdateInterval = null;

        console.log("Auto-update stopped.");
    }
    
    _updateButtonState(isActive) {
        if (!this.updateButton) return;
        this.updateButton.style.color = isActive ? "blue" : "#828282";
        const icon = this.updateButton.querySelector("i");
        if (icon) {
            icon.classList.toggle("spin", isActive);
        }
    }

    _handleNetworkError(error, context) {
        if (error.message.includes("rate limit") || error.message.includes("fetch")) {
            alert(`Rate limit or network error encountered. ${context} stopped.`);
            this.stop();
        }
    }
}