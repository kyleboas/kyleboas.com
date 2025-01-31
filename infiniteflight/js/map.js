import { getFlights } from "./flightsTable.js";
import { fetchAirportCoordinates } from "./airport.js";

export async function showMap(mainAirportIcao) {
    const mapContainer = document.getElementById("mapContainer");
    const canvas = document.getElementById("flightCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = mapContainer.clientWidth;
    canvas.height = mapContainer.clientHeight;

    let zoomLevel = 1;
    let panX = 0, panY = 0;
    let selectedFlightId = null; // To track selected flight for highlighting

    // Fetch main airport coordinates
    const airportCoordinates = await fetchAirportCoordinates(mainAirportIcao);
    if (!airportCoordinates) {
        console.error("Failed to fetch airport coordinates.");
        return;
    }

    const flights = getFlights();
    if (!flights || flights.length === 0) {
        console.warn("No inbound flights available.");
        return;
    }

    // Convert lat/lon to canvas coordinates
    function mapToCanvas(lat, lon) {
        const scale = 10 * zoomLevel;
        return {
            x: (lon - airportCoordinates.longitude) * scale + canvas.width / 2 + panX,
            y: canvas.height / 2 - (lat - airportCoordinates.latitude) * scale + panY,
        };
    }

    // Draw all aircraft
    function drawAircraft() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        flights.forEach((flight) => {
            if (!flight.latitude || !flight.longitude || !flight.heading) return;

            const pos = mapToCanvas(flight.latitude, flight.longitude);
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate((flight.heading * Math.PI) / 180);

            // Highlight selected aircraft
            if (flight.flightId === selectedFlightId) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, 2 * Math.PI);
                ctx.stroke();
            }

            // Draw aircraft
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(5, 5);
            ctx.lineTo(-5, 5);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        });
    }

    // Handle row click to highlight aircraft
    function setupTableClickHighlighting() {
        document.querySelectorAll("#flightsTable tbody tr").forEach((row) => {
            row.addEventListener("click", () => {
                selectedFlightId = row.getAttribute("flight-id");
                drawAircraft();
            });
        });
    }

    // Handle zoom & pan
    function setupTouchControls() {
        let lastTouch = null;
        let lastDist = 0;

        canvas.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) {
                lastTouch = e.touches[0];
            } else if (e.touches.length === 2) {
                lastDist = getTouchDistance(e.touches);
            }
        });

        canvas.addEventListener("touchmove", (e) => {
            if (e.touches.length === 1 && lastTouch) {
                panX += e.touches[0].clientX - lastTouch.clientX;
                panY += e.touches[0].clientY - lastTouch.clientY;
                lastTouch = e.touches[0];
                drawAircraft();
            } else if (e.touches.length === 2) {
                let newDist = getTouchDistance(e.touches);
                zoomLevel *= newDist / lastDist;
                zoomLevel = Math.max(0.5, Math.min(3, zoomLevel));
                lastDist = newDist;
                drawAircraft();
            }
        });

        canvas.addEventListener("touchend", () => {
            lastTouch = null;
            lastDist = 0;
        });

        canvas.addEventListener("wheel", (e) => {
            zoomLevel += e.deltaY * -0.001;
            zoomLevel = Math.max(0.5, Math.min(3, zoomLevel));
            drawAircraft();
        });

        function getTouchDistance(touches) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }

    // Setup and render
    mapContainer.style.display = "block";
    setupTouchControls();
    drawAircraft();
    setupTableClickHighlighting();
}