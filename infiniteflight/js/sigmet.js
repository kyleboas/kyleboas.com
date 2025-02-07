const SIGMET_API = "https://aviationweather.gov/api/data/isigmet?format=json&hazard=turb";

export async function fetchSIGMET() {
    try {
        const response = await fetch(SIGMET_API);
        if (!response.ok) throw new Error(`Failed to fetch SIGMET data: ${response.status}`);

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error(`Invalid JSON response: ${await response.text()}`);
        }

        console.log("Fetched SIGMET Data:", data); // Debugging output

        if (!Array.isArray(data)) {
            throw new Error("SIGMET data is not an array.");
        }

        // Filter valid SIGMETs with correct coordinates
        const validSIGMETs = data.filter(sigmet => 
            Array.isArray(sigmet.coords) &&
            sigmet.coords.length > 0 &&
            sigmet.coords.every(point => 
                typeof point.lat === "number" && typeof point.lon === "number"
            )
        );

        if (validSIGMETs.length === 0) {
            console.warn("No valid SIGMET data to process.");
        }

        return validSIGMETs;
    } catch (error) {
        console.error("Error fetching SIGMET data:", error);
        return [];
    }
}

// Convert Latitude/Longitude to X/Y (Mercator Projection)
export function project([lon, lat], canvas, scale, offsetX, offsetY) {
    if (typeof lon !== "number" || typeof lat !== "number") {
        console.warn("Invalid coordinates provided for projection:", lon, lat);
        return [0, 0];
    }

    const x = (lon + 180) * (canvas.width / 360);
    const y = (canvas.height / 2) - 
              (canvas.width * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) / (2 * Math.PI));

    return [x * scale + offsetX, y * scale + offsetY];
}

// Draw SIGMET Polygons on Map
export function drawSIGMET(ctx, canvas, sigmetData, scale, offsetX, offsetY) {
    if (!ctx || typeof ctx.beginPath !== "function") {
        console.error("Invalid canvas context provided.");
        return;
    }

    if (!Array.isArray(sigmetData) || sigmetData.length === 0) {
        console.warn("No valid SIGMET data to draw.");
        return;
    }

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";

    sigmetData.forEach(sigmet => {
        if (!Array.isArray(sigmet.coords) || sigmet.coords.length === 0) {
            console.warn("Skipping SIGMET with invalid coords:", sigmet);
            return;
        }

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