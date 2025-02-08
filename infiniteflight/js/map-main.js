import { fetchSIGMET } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const canvas = document.getElementById("mapCanvas");
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) {
        console.error("Canvas not found or context is null.");
        return;
    }

    let worldData = null;
    let sigmetData = [];
    let offsetX = 0, offsetY = 0, scale = 150;
    let isDragging = false, startX = 0, startY = 0;
    let velocityX = 0, velocityY = 0;
    let lastZoomDistance = null;
    let lastTapTime = 0;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr);
        drawMap();
    }
    window.addEventListener("resize", resizeCanvas);

    try {
        const response = await fetch("https://d3js.org/world-110m.v1.json");
        const topoData = await response.json();
        worldData = topojson.feature(topoData, topoData.objects.land);
        console.log("Land Data Loaded:", worldData);
    } catch (error) {
        console.error("Error loading world map:", error);
        return;
    }

    try {
        sigmetData = await fetchSIGMET();
        console.log("SIGMET Data Ready:", sigmetData);
    } catch (error) {
        console.error("Error fetching SIGMET data:", error);
    }

    drawMap();

    const projection = d3.geoMercator()
        .scale(scale)
        .translate([canvas.width / 2 + offsetX, canvas.height / 2 + offsetY]);

    const pathGenerator = d3.geoPath().projection(projection).context(ctx);

    function drawMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        projection.scale(scale).translate([canvas.width / 2 + offsetX, canvas.height / 2 + offsetY]);

        // Draw Landmass
        ctx.fillStyle = "transparent";
        ctx.strokeStyle = "#ABB0B0";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        pathGenerator(worldData);
        ctx.stroke();

        // Draw SIGMETs
        drawSIGMETs();
        console.log("Map drawn successfully.");
    }

    function drawSIGMETs() {
        if (!sigmetData || sigmetData.length === 0) {
            console.warn("No SIGMETs to draw.");
            return;
        }

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; // Semi-transparent red fill

        sigmetData.forEach(sigmet => {
            if (!sigmet.geometry || sigmet.geometry.type !== "Polygon") {
                console.warn("Invalid SIGMET geometry:", sigmet);
                return;
            }

            sigmet.geometry.coordinates.forEach(polygon => {
                ctx.beginPath();
                polygon.forEach(([lon, lat], index) => {
                    if (isNaN(lon) || isNaN(lat)) {
                        console.error("Invalid SIGMET coordinates:", lon, lat);
                        return;
                    }
                    const [x, y] = projection([lon, lat]);
                    if (index === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
        });

        console.log("SIGMETs drawn successfully.");
    }

    function applyInertia() {
        if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
            offsetX += velocityX;
            offsetY += velocityY;
            velocityX *= 0.95;
            velocityY *= 0.95;
            drawMap();
            requestAnimationFrame(applyInertia);
        }
    }

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

    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const scaleFactor = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        scale *= scaleFactor;
        drawMap();
    });

    canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            velocityX = 0;
            velocityY = 0;

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

    function getDistance(touch1, touch2) {
        return Math.sqrt((touch1.clientX - touch2.clientX) ** 2 + (touch1.clientY - touch2.clientY) ** 2);
    }

    resizeCanvas();
});