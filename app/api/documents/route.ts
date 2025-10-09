import { API_URL } from "@/lib/utils";

// External documents API base URL
const DOCUMENTS_API_URL = `${API_URL}/documents`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId");

  // if (!departmentId) {
  //   return Response.json(
  //     {
  //       success: false,
  //       error: "Department ID is required",
  //     },
  //     { status: 400 }
  //   );
  // }

  try {
    // Construct the filter URL for the external API
    let filterUrl = DOCUMENTS_API_URL;
    if (departmentId) {
      filterUrl = `${DOCUMENTS_API_URL}?filter=department.id||eq||${departmentId}`;
    }

    const response = await fetch(filterUrl, {
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

    const documents = await response.json();

    // Transform the external API response to match our internal structure
    const transformedDocuments = documents.map((doc: any) => ({
      id: doc.id.toString(),
      name: doc.filename,
      departmentId: doc.department.id.toString(),
      size: undefined, // Not provided by external API
      createdAt: doc.createdAt,
      department: doc.department,
    }));

    return Response.json({
      success: true,
      data: transformedDocuments,
    });
  } catch (error) {
    console.error("Failed to fetch documents from external API:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch documents",
      },
      { status: 500 }
    );
  }
}
