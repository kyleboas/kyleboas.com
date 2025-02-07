import { fetchWorldMap } from "./api.js";

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (geoJSONData) drawMap();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let geoJSONData = null;
let offsetX = 0, offsetY = 0, scale = 150;
let dragging = false, startX, startY;

// Load world map
async function loadMap() {
    geoJSONData = await fetchWorldMap();
    if (geoJSONData) drawMap();
}
loadMap();

// Convert Lat/Lon to X/Y using Mercator Projection
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