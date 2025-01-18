import { serve } from "https://deno.land/std@0.184.0/http/server.ts";

// Replace this with your Infinite Flight API key
const API_KEY = Deno.env.get("API_KEY");
const API_BASE_URL = "https://api.infiniteflight.com/public/v2";

// Helper function for error responses
function respondWithError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Proxy handler
async function proxyHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const { pathname, search } = url; // Extract path and query parameters

    // Handle GET requests
    if (req.method === "GET") {
      const response = await fetch(`${API_BASE_URL}${pathname}${search}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle POST requests
    else if (req.method === "POST") {
      const { endpoint, method = "GET", body } = await req.json();

      if (!endpoint) {
        return respondWithError("Endpoint is required", 400);
      }

      const options: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      };

      // Add body if it's a POST request
      if (method === "POST" && body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unsupported HTTP methods
    else {
      return respondWithError("Only GET and POST requests are allowed", 405);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return respondWithError("An error occurred while processing the request");
  }
}

// Start the server
serve(proxyHandler);