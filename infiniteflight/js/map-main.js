document.addEventListener("DOMContentLoaded", async () => {
    const canvas = document.getElementById("mapCanvas");
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) {
        console.error("Canvas not found or context is null.");
        return;
    }

    // Set canvas dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (worldData) drawMap(); // Redraw on resize
    }
    window.addEventListener("resize", resizeCanvas);

    // Load TopoJSON world map
    let worldData = null;
    try {
        const response = await fetch("https://d3js.org/world-110m.v1.json");
        const topoData = await response.json();
        worldData = topojson.feature(topoData, topoData.objects.countries);
    } catch (error) {
        console.error("Error loading world map:", error);
        return;
    }

    console.log("World Data Loaded:", worldData);

    // D3 Mercator Projection
    const projection = d3.geoMercator()
        .scale(150) // Adjust scale as needed
        .translate([canvas.width / 2, canvas.height / 2]);

    const pathGenerator = d3.geoPath().projection(projection).context(ctx);

    // Draw map on canvas
    function drawMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ccc";
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 0.5;

        worldData.features.forEach(feature => {
            ctx.beginPath();
            pathGenerator(feature);
            ctx.fill();
            ctx.stroke();
        });

        console.log("Map drawn successfully.");
    }

    resizeCanvas();
});