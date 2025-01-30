import { getFlights } from "/*/inbounds-test.js";

export function showMap(flight) {
    if (!flight || !flight.latitude || !flight.longitude || !flight.heading) {
        console.error("Invalid flight data:", flight);
        return;
    }

    const mapContainer = document.getElementById("mapContainer");
    const canvas = document.getElementById("flightCanvas");
    const ctx = canvas.getContext("2d");

    canvas.width = mapContainer.clientWidth;
    canvas.height = mapContainer.clientHeight;

    let zoomLevel = 1;
    let panX = 0, panY = 0;
    let currentPos = { latitude: flight.latitude, longitude: flight.longitude };
    let targetPos = { latitude: flight.latitude, longitude: flight.longitude };

    function mapToCanvas(lat, lon) {
        return {
            x: (lon + 180) * 10 * zoomLevel + panX,
            y: canvas.height - ((lat + 90) * 10 * zoomLevel) + panY
        };
    }

    function drawAircraft() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const pos = mapToCanvas(currentPos.latitude, currentPos.longitude);

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate((flight.heading * Math.PI) / 180);
        
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(5, 5);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    function animateMovement() {
        if (!targetPos) return;

        currentPos.latitude += (targetPos.latitude - currentPos.latitude) * 0.05;
        currentPos.longitude += (targetPos.longitude - currentPos.longitude) * 0.05;

        drawAircraft();

        if (Math.abs(currentPos.latitude - targetPos.latitude) > 0.0001 ||
            Math.abs(currentPos.longitude - targetPos.longitude) > 0.0001) {
            requestAnimationFrame(animateMovement);
        }
    }

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
                let dx = e.touches[0].clientX - lastTouch.clientX;
                let dy = e.touches[0].clientY - lastTouch.clientY;
                
                panX += dx;
                panY += dy;

                lastTouch = e.touches[0];
                drawAircraft();
            } else if (e.touches.length === 2) {
                let newDist = getTouchDistance(e.touches);
                let scale = newDist / lastDist;

                zoomLevel *= scale;
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

    mapContainer.style.display = "block";
    setupTouchControls();
    drawAircraft();

    let updateCounter = 0;
    let updateInterval = setInterval(() => {
        if (updateCounter >= flight.interpolatedPositions.length) {
            clearInterval(updateInterval);
            return;
        }

        targetPos = flight.interpolatedPositions[updateCounter];
        animateMovement();
        updateCounter++;
    }, 1000);
}