import { plotAirport } from "./plotAirport.js";

document.addEventListener("DOMContentLoaded", async () => {
    const canvas = document.getElementById("mapCanvas");
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) {
        console.error("Canvas not found or context is null.");
        return;
    }

    // ICAO input field
    const inputContainer = document.createElement("div");
    inputContainer.style.position = "absolute";
    inputContainer.style.top = "10px";
    inputContainer.style.left = "10px";
    inputContainer.style.background = "white";
    inputContainer.style.padding = "5px";
    inputContainer.style.borderRadius = "5px";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Enter ICAO Code";
    inputContainer.appendChild(input);

    const button = document.createElement("button");
    button.textContent = "Plot Airport";
    inputContainer.appendChild(button);

    document.body.appendChild(inputContainer);

    // Variables for map
    let worldData = null;
    let offsetX = 0, offsetY = 0, scale = 150;
    let isDragging = false, startX = 0, startY = 0;
    let velocityX = 0, velocityY = 0;
    let lastTapTime = 0;
    let lastZoomDistance = null;

    // Initialize projection right away
    let projection = d3.geoMercator()
        .scale(scale)
        .translate([window.innerWidth / 2 + offsetX, window.innerHeight / 2 + offsetY]);

    // Initialize pathGenerator with the projection
    const pathGenerator = d3.geoPath().projection(projection).context(ctx);

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any transforms
        ctx.scale(dpr, dpr);

        // Update projection instead of recreating it
        projection.scale(scale)
            .translate([canvas.width / 2 + offsetX, canvas.height / 2 + offsetY]);

        if (worldData) drawMap();
    }
    window.addEventListener("resize", resizeCanvas);

    // Add click handler for plotting airports after projection is initialized
    button.addEventListener("click", async () => {
        const icao = input.value.trim().toUpperCase();
        if (icao) {
            await plotAirport(icao, ctx, projection);
        }
    });

    try {
        const response = await fetch("https://d3js.org/world-110m.v1.json");
        const topoData = await response.json();
        worldData = topojson.feature(topoData, topoData.objects.land);
    } catch (error) {
        console.error("Error loading world map:", error);
        return;
    }

    console.log("Land Data Loaded:", worldData);

    function drawMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        projection.scale(scale).translate([canvas.width / 2 + offsetX, canvas.height / 2 + offsetY]);

        ctx.strokeStyle = "#ABB0B0";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        pathGenerator(worldData);
        ctx.stroke();

        console.log("Coastlines drawn successfully.");
    }

    // Inertia effect for smooth panning
    function applyInertia() {
        if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
            offsetX += velocityX;
            offsetY += velocityY;
            velocityX *= 0.95; // Slow down over time
            velocityY *= 0.95;
            drawMap();
            requestAnimationFrame(applyInertia);
        }
    }

    // Mouse drag for panning
    canvas.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        velocityX = 0;
        velocityY = 0;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            offsetX += dx;
            offsetY += dy;
            velocityX = dx;
            velocityY = dy;
            startX = e.clientX;
            startY = e.clientY;
            drawMap();
        }
    });

    canvas.addEventListener("mouseup", () => {
        isDragging = false;
        applyInertia();
    });

    canvas.addEventListener("mouseleave", () => {
        isDragging = false;
        applyInertia();
    });

    // Mouse wheel for zooming
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const scaleFactor = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        scale *= scaleFactor;
        drawMap();
    });

    // Touch events for panning & pinch-to-zoom
    canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            velocityX = 0;
            velocityY = 0;

            // Double tap to zoom
            const currentTime = new Date().getTime();
            if (currentTime - lastTapTime < 300) {
                scale *= 1.2;
                drawMap();
            }
            lastTapTime = currentTime;
        } else if (e.touches.length === 2) {
            isDragging = false;
            lastZoomDistance = getDistance(e.touches[0], e.touches[1]);
        }
    });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();

        if (e.touches.length === 1 && isDragging) {
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            offsetX += dx;
            offsetY += dy;
            velocityX = dx;
            velocityY = dy;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            drawMap();
        } else if (e.touches.length === 2) {
            const newZoomDistance = getDistance(e.touches[0], e.touches[1]);
            if (lastZoomDistance) {
                const zoomFactor = newZoomDistance / lastZoomDistance;

                // Find midpoint of pinch in screen coordinates
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                // Convert screen midpoint to world coordinates before zooming
                const worldMidX = (midX - canvas.width / 2 - offsetX) / scale;
                const worldMidY = (midY - canvas.height / 2 - offsetY) / scale;

                // Apply zoom
                scale *= zoomFactor;

                // Convert world midpoint back to screen coordinates after zooming
                offsetX = midX - (worldMidX * scale) - canvas.width / 2;
                offsetY = midY - (worldMidY * scale) - canvas.height / 2;

                drawMap();
            }
            lastZoomDistance = newZoomDistance;
        }
    });

    canvas.addEventListener("touchend", () => {
        isDragging = false;
        applyInertia();
        lastZoomDistance = null;
    });

    // Helper function to calculate distance between two touch points
    function getDistance(touch1, touch2) {
        return Math.sqrt((touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2);
    }

    // Call resizeCanvas to set initial dimensions and render the map
    resizeCanvas();
});