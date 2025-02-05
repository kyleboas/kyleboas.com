import { serve } from "https://deno.land/std@0.184.0/http/server.ts";

// API Keys from Environment Variables
const API_KEY = Deno.env.get("API_KEY");
const AIRPORTDB_KEY = Deno.env.get("AIRPORTDB_KEY");

// API Base URLs
const API_BASE_URL = "https://api.infiniteflight.com/public/v2";
const AIRPORTDB_URL = "https://airportdb.io/api/v1/airport";

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

    // Handle AirportDB API Requests (e.g., /api/airport/KPHL)
    if (pathname.startsWith("/api/airport/")) {
      const icao = pathname.split("/").pop(); // Extract ICAO code
      if (!icao) return respondWithError("ICAO code is required", 400);

      const response = await fetch(`${AIRPORTDB_URL}/${icao}?apiKey=${AIRPORTDB_KEY}`);

      const data = await response.json();

      if (!response.ok) {
        return addCORSHeaders(
          new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return addCORSHeaders(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // Handle Infinite Flight API Requests
    if (pathname.startsWith("/api/if")) {
      const ifPath = pathname.replace("/api/if", "");
      const response = await fetch(`${API_BASE_URL}${ifPath}${search}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return addCORSHeaders(
          new Response(JSON.stringify(data), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return addCORSHeaders(
        new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
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