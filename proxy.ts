import { serve } from "https://deno.land/std@0.184.0/http/server.ts";

// API Keys from Environment Variables
const API_KEY = Deno.env.get("API_KEY");
const AIRPORTDB_KEY = Deno.env.get("AIRPORTDB_KEY");

// API Base URLs
const API_BASE_URL = "https://api.infiniteflight.com/public/v2";
const AIRPORTDB_URL = "https://airportdb.io/api/v1/airport";
const SIGMET_URL = "https://aviationweather.gov/api/data/isigmet";

// Helper function for error responses
function respondWithError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Add CORS headers to the response
function addCORSHeaders(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

// Get current UTC time formatted for SIGMET API (YYYYMMDD_HHmmssZ)
function getCurrentUTCDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}${seconds}Z`;
}

// Proxy handler
async function proxyHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const { pathname, search } = url; // Extract path and query parameters

    // Handle preflight OPTIONS requests (CORS)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Handle SIGMET API Request
    if (pathname.startsWith("/api/sigmet")) {
      const dateParam = getCurrentUTCDate();
      const sigmetUrl = `${SIGMET_URL}?format=json&hazard=turb&date=${dateParam}`;

      console.log("Fetching SIGMET data from:", sigmetUrl);

      const response = await fetch(sigmetUrl, {
        headers: { "Accept": "*/*" },
      });

      if (!response.ok) {
        console.error(`SIGMET API Error: ${response.status} - ${response.statusText}`);
        return respondWithError(`Error fetching SIGMET data: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return addCORSHeaders(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // Handle AirportDB API Requests
    if (pathname.startsWith("/api/airport/")) {
      const icao = pathname.split("/").pop();
      if (!icao) return respondWithError("ICAO code is required", 400);

      if (!AIRPORTDB_KEY) {
        console.error("AIRPORTDB_KEY is missing");
        return respondWithError("Server configuration error: Missing API Token", 500);
      }

      const apiUrl = `${AIRPORTDB_URL}/${icao}?apiToken=${AIRPORTDB_KEY}`;
      console.log("Fetching AirportDB:", apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        return respondWithError(`Error fetching airport data: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return addCORSHeaders(new Response(JSON.stringify(data), { status: 200 }));
    }

    // Handle Infinite Flight API Requests
    if (pathname.startsWith("/api/if")) {
      const ifPath = pathname.replace("/api/if", "");

      if (!API_KEY) {
        console.error("API_KEY is missing");
        return respondWithError("Server configuration error: Missing API Key", 500);
      }

      const response = await fetch(`${API_BASE_URL}${ifPath}${search}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${API_KEY}` },
      });

      if (!response.ok) {
        console.error(`Infinite Flight API Error: ${response.status} - ${response.statusText}`);
        return respondWithError(`Error fetching IF data: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return addCORSHeaders(new Response(JSON.stringify(data), { status: 200 }));
    }

    // Unsupported endpoint
    return respondWithError("Invalid API endpoint", 404);
  } catch (error) {
    console.error("Proxy error:", error);
    return respondWithError("An error occurred while processing the request");
  }
}

// Start the server
serve(proxyHandler);
console.log("Deno Proxy running on http://localhost:8000");