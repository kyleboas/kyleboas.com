import { fetchWorldMap } from "./api.js";
import { fetchSIGMET, drawSIGMET } from "./sigmet.js";

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// Variables
let geoJSONData = null;
let sigmetData = [];
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
        sigmetData = await fetchSIGMET();
        drawMap();
    } catch (error) {
        console.error("Error loading map data:", error);
    }
}

// Initialize app properly
async function initialize() {
    await loadMap();
    resizeCanvas();
}
initialize();

// Auto-refresh SIGMET every 5 minutes
setInterval(() => {
    (async () => {
        try {
            sigmetData = await fetchSIGMET();
            drawMap();
        } catch (error) {
            console.error("Error fetching SIGMET data:", error);
        }
    })();
}, 300000);

// Convert Latitude/Longitude to X/Y using Mercator Projection
function project([lon, lat]) {
    const x = (lon + 180) * (canvas.width / 360);
    const y = (canvas.height / 2) - (canvas.width * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) / (2 * Math.PI));
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
        ctx.beginPath();
        feature.geometry.coordinates.forEach(polygon => {
            polygon.forEach((point, index) => {
                const [x, y] = project(point);
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });

    // Draw SIGMET areas
    drawSIGMET(ctx, canvas, sigmetData, scale, offsetX, offsetY);
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