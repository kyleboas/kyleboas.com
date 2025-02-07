import { fetchWorldMap } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("mapCanvas");
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Canvas context could not be retrieved!");
        return;
    }

    // Variables
    let geoJSONData = null;
    let offsetX = 0, offsetY = 0, scale = 150;
    let dragging = false, startX = 0, startY = 0;

    // Resize canvas dynamically
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (geoJSONData) drawMap();
    }
    window.addEventListener("resize", resizeCanvas);

    // Load and draw the map
    async function loadMap() {
        try {
            geoJSONData = await fetchWorldMap();
            if (!geoJSONData || !geoJSONData.features) {
                console.error("Invalid world map data:", geoJSONData);
                return;
            }
            console.log("World Map Loaded:", geoJSONData);
            drawMap();
        } catch (error) {
            console.error("Error loading map data:", error);
        }
    }

    // Initialize canvas and map
    async function initialize() {
        resizeCanvas();
        await loadMap();
    }
    window.onload = initialize;

    // Convert lat/lon to X/Y using Mercator Projection
    function project([lon, lat]) {
        if (typeof lon !== "number" || typeof lat !== "number") {
            console.warn("Invalid coordinates for projection:", [lon, lat]);
            return [0, 0];
        }

        const λ = (lon * Math.PI) / 180;
        const φ = (lat * Math.PI) / 180;

        const x = ((λ + Math.PI) / (2 * Math.PI)) * canvas.width;
        const y = ((1 - Math.log(Math.tan(φ) + 1 / Math.cos(φ)) / Math.PI) / 2) * canvas.height;

        return [(x - canvas.width / 2) * scale + offsetX, (y - canvas.height / 2) * scale + offsetY];
    }

    // Draw the world map
    function drawMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ccc";
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 0.5;

        if (!geoJSONData || !geoJSONData.features) return;

        geoJSONData.features.forEach(feature => {
            const { geometry } = feature;
            if (!geometry || !geometry.type || !geometry.coordinates) return;

            ctx.beginPath();

            let polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
            polygons.forEach(polygon => {
                polygon.forEach(ring => {
                    ring.forEach((point, index) => {
                        if (!Array.isArray(point) || point.length !== 2) {
                            console.warn("Skipping invalid point:", point);
                            return;
                        }

                        const [x, y] = project(point);
                        if (index === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                });
            });

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        console.log("Map drawn successfully.");
    }

    // Mouse drag for panning
    canvas.addEventListener("mousedown", (e) => {
        dragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (dragging) {
            offsetX = e.clientX - startX;
            offsetY = e.clientY - startY;
            requestAnimationFrame(drawMap);
        }
    });

    canvas.addEventListener("mouseup", () => dragging = false);
    canvas.addEventListener("mouseleave", () => dragging = false);

    // Mouse wheel zoom with cursor centering
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();

        const zoomFactor = 1.1;
        const scaleFactor = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

        // Zoom at the cursor position
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        offsetX = mouseX - (mouseX - offsetX) * scaleFactor;
        offsetY = mouseY - (mouseY - offsetY) * scaleFactor;
        scale *= scaleFactor;

        requestAnimationFrame(drawMap);
    });
});