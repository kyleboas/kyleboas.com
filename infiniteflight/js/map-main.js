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

    // Load TopoJSON world map
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
        .scale(scale)
        .translate([canvas.width / 2 + offsetX, canvas.height / 2 + offsetY]);

    const pathGenerator = d3.geoPath().projection(projection).context(ctx);

    // Draw the map
    function drawMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        projection.scale(scale).translate([canvas.width / 2 + offsetX, canvas.height / 2 + offsetY]);

        ctx.fillStyle = "transparent";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;

        worldData.features.forEach(feature => {
            ctx.beginPath();
            pathGenerator(feature);
            ctx.fill();
            ctx.stroke();
        });

        console.log("Map drawn successfully.");
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
                scale *= 1;
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
                
                // **Fix: Center zoom at pinch midpoint**
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                // Adjust offset so zoom happens at pinch center
                offsetX = midX - (midX - offsetX) * zoomFactor;
                offsetY = midY - (midY - offsetY) * zoomFactor;
                scale *= zoomFactor;

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

    resizeCanvas();
});