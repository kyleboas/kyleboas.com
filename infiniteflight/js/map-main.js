document.addEventListener("DOMContentLoaded", async () => {
    const canvas = document.getElementById("mapCanvas");
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) {
        console.error("Canvas not found or context is null.");
        return;
    }

    // Variables for panning & zooming
    let worldData = null;
    let offsetX = 0, offsetY = 0, scale = 150;
    let isDragging = false, startX = 0, startY = 0;
    let velocityX = 0, velocityY = 0;
    let lastZoomDistance = null;
    let lastTapTime = 0;

    // Fix pixelation on high-DPI screens
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr); // Fix blurry lines

        if (worldData) drawMap();
    }
    window.addEventListener("resize", resizeCanvas);

    // Load TopoJSON land data (not individual country borders)
    try {
        const response = await fetch("https://d3js.org/world-110m.v1.json");
        const topoData = await response.json();
        worldData = topojson.feature(topoData, topoData.objects.land); // Use 'land' only
    } catch (error) {
        console.error("Error loading world map:", error);
        return;
    }

    console.log("Land Data Loaded:", worldData);

    // D3 Mercator Projection
    const projection = d3.geoMercator()
        .scale(scale)
        .translate([canvas.width / 2 + offsetX, canvas.height / 2 + offsetY]);

    const pathGenerator = d3.geoPath().projection(projection).context(ctx);

    // Draw only land-sea borders (coastlines)
    function drawMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        projection.scale(scale).translate([canvas.width / 2 + offsetX, canvas.height / 2 + offsetY]);

        ctx.fillStyle = "transparent"; // No fill for land
        ctx.strokeStyle = "#ABB0B0"; // Land-sea border color
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        pathGenerator(worldData); // Draw only the landmass
        ctx.stroke();

        console.log("Coastlines drawn successfully.");
    }

    resizeCanvas();
});