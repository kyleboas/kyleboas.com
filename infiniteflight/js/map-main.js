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
    let dragging = false, startX, startY;

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (geoJSONData !== null) drawMap();
    }
    window.addEventListener("resize", resizeCanvas);

    // Load world map
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

    // Initialize app properly
    async function initialize() {
        resizeCanvas();
        await loadMap();
    }
    initialize();

    // Convert Latitude/Longitude to X/Y using Mercator Projection
    function project([lon, lat]) {
        if (typeof lon !== "number" || typeof lat !== "number") {
            console.warn("Invalid coordinates for projection:", [lon, lat]);
            return [0, 0];
        }

        const x = (lon + 180) * (canvas.width / 360);
        const y = (canvas.height / 2) - 
                  (canvas.width * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) / (2 * Math.PI));

        return [x * scale + offsetX, y * scale + offsetY];
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

            let polygons = geometry.type === "Polygon" 
                ? [geometry.coordinates]  
                : geometry.coordinates;   

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
    }

    // Panning Events
    canvas.addEventListener("mousedown", (e) => {
        dragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (dragging) {
            offsetX = e.clientX - startX;
            offsetY = e.clientY - startY;
            drawMap();
        }
    });

    canvas.addEventListener("mouseup", () => dragging = false);

    // Zooming with Mouse Wheel
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        scale *= e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        drawMap();
    });
});