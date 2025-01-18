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
  if (req.method !== "POST") {
    return respondWithError("Only POST requests are allowed", 405);
  }

  try {
    const { endpoint, method = "GET", body } = await req.json();

    if (!endpoint) {
      return respondWithError("Endpoint is required", 400);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(body) : undefined,
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
  } catch (error) {
    console.error("Proxy error:", error);
    return respondWithError("An error occurred while processing the request");
  }
}

// Start the server
serve(proxyHandler);