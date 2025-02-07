const SIGMET_API = "https://aviationweather.gov/api/data/isigmet?format=json&hazard=turb";

export async function fetchSIGMET() {
    try {
        const response = await fetch(SIGMET_API);
        if (!response.ok) throw new Error("Failed to fetch SIGMET data");
        return await response.json();
    } catch (error) {
        console.error("Error fetching SIGMET data:", error);
        return [];
    }
}

// Convert Latitude/Longitude to X/Y (Mercator Projection)
export function project([lon, lat], canvas, scale, offsetX, offsetY) {
    const x = (lon + 180) * (canvas.width / 360);
    const y = (canvas.height / 2) - (canvas.width * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) / (2 * Math.PI));
    return [x * scale + offsetX, y * scale + offsetY];
}

// Draw SIGMET Polygons on Map
export function drawSIGMET(ctx, canvas, sigmetData, scale, offsetX, offsetY) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";

    sigmetData.forEach(sigmet => {
        ctx.beginPath();
        sigmet.coords.forEach((point, index) => {
            const [x, y] = project([point.lon, point.lat], canvas, scale, offsetX, offsetY);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
}