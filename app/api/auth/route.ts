import { API_URL } from "@/lib/utils";

// External auth API URL
const AUTH_API_URL = `${API_URL}/auth/login`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create the payload for the external API
    const payload = {
      email,
      password,
    };

    console.log("Attempting login for email:", email);

    // Make request to external auth API
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout for auth
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("External auth API error:", data);
      return Response.json(
        {
          success: false,
          error: data.message || "Login failed",
        },
        { status: response.status }
      );
    }

    console.log("Login successful for user:", data.user?.email);

    // Return the auth response as-is since it already has the correct format
    return Response.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Auth API error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(
        {
          success: false,
          error: "Login request timed out. Please try again.",
        },
        { status: 408 }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process login request",
      },
      { status: 500 }
    );
  }
}
