// External API endpoint
const DEPARTMENTS_API_URL = "http://localhost:3000/departments";

// Fallback departments in case external API fails
const fallbackDepartments = [
  { id: "policy", name: "Policy" },
  { id: "hr", name: "HR" },
  { id: "finance", name: "Finance" },
  { id: "engineering", name: "Engineering" },
  { id: "marketing", name: "Marketing" },
  { id: "legal", name: "Legal" },
];

export async function GET() {
  try {
    // Fetch from external API
    const response = await fetch(DEPARTMENTS_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const departments = await response.json();

    return Response.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Failed to fetch from external departments API:", error);

    // Return fallback departments if external API fails
    return Response.json({
      success: true,
      data: fallbackDepartments,
      fallback: true,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
