// External chunks API base URL
import { API_URL } from "@/lib/utils";

// External chunks API base URL
const CHUNKS_API_URL = `${API_URL}/chunks`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return Response.json(
      {
        success: false,
        error: "Document ID is required",
      },
      { status: 400 }
    );
  }

  try {
    // Construct the filter URL for the external API
    const filterUrl = `${CHUNKS_API_URL}?filter=document.id||eq||${documentId}`;

    const response = await fetch(filterUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout for chunks
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const chunks = await response.json();

    // Transform the external API response to match our internal structure
    const transformedChunks = chunks.map((chunk: any) => ({
      id: chunk.id.toString(),
      content: chunk.text,
      section_title: chunk.section_title,
      metadata: chunk.metadata,
      start_index: chunk.start_index,
      end_index: chunk.end_index,
      page: null, // Not provided by external API
      score: null, // Not provided by external API
      source: chunk.document?.filename || null,
      document: chunk.document,
    }));

    return Response.json({
      success: true,
      data: transformedChunks,
    });
  } catch (error) {
    console.error("Failed to fetch chunks from external API:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch chunks",
      },
      { status: 500 }
    );
  }
}
