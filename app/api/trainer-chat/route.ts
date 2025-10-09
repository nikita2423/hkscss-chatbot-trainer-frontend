// External chat API URL
const CHAT_API_URL = "http://localhost:3000/chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, documentIds, sessionId } = body;

    if (!question) {
      return Response.json(
        { success: false, error: "Question is required" },
        { status: 400 }
      );
    }

    if (
      !documentIds ||
      !Array.isArray(documentIds) ||
      documentIds.length === 0
    ) {
      return Response.json(
        { success: false, error: "At least one document must be selected" },
        { status: 400 }
      );
    }

    // Create the payload for the external API
    const payload = {
      question,
      documentIds: documentIds.map((id: string) => parseInt(id, 10)), // Convert to integers
      sessionId: sessionId || 1, // Default session ID if not provided
    };

    console.log("Sending to external API:", payload);

    // Make request to external chat API
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout for chat
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();

    console.log("External API response:", data);

    // Transform the response to match our expected format
    const transformedResponse = {
      success: true,
      sessionId: data.session_id,
      answer: data.answer,
      sources:
        data.sources?.map((source: any) => ({
          id: source.chunk_id,
          section_title: source.section_title,
          start_index: source.start_index,
          end_index: source.end_index,
          reference: source.reference,
          score: source.score,
          source: source.source,
          content: source.content, // Will be populated by the frontend when needed
        })) || [],
    };

    return Response.json(transformedResponse);
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process chat request",
      },
      { status: 500 }
    );
  }
}
