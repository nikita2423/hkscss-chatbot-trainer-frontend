import { API_URL } from "@/lib/utils";

// External session API URL
const SESSION_API_URL = `${API_URL}/chat/session`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return Response.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create the payload for the external API
    const payload = {
      userId,
    };

    console.log("Creating new chat session for user:", userId);

    // Get authorization header from request
    const authHeader = request.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Make request to external session API
    const response = await fetch(SESSION_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("External session API error:", errorData);
      return Response.json(
        {
          success: false,
          error: `Failed to create session: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Session created successfully:", data);

    // Return the session response
    return Response.json({
      success: true,
      sessionId: data.id,
      ...data,
    });
  } catch (error) {
    console.error("Session API error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          success: false,
          error: "Session creation request timed out. Please try again.",
        },
        { status: 408 }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create session",
      },
      { status: 500 }
    );
  }
}
