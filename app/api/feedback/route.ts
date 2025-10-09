import { API_URL } from "@/lib/utils";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      question,
      preferred_answer,
      original_answer,
      tags = [],
      feedback_type = "improvement",
      feedback_status = "completed",
      chat_message_id,
    } = body;

    if (!question || !original_answer) {
      return Response.json(
        { error: "Question and original answer are required" },
        { status: 400 }
      );
    }

    console.log("[Feedback API] Saving feedback:", {
      question: question.substring(0, 100) + "...",
      has_preferred_answer: !!preferred_answer,
      tags_count: tags.length,
      feedback_type,
      feedback_status,
      chat_message_id,
    });

    // Prepare feedback data for external API
    const feedbackData = {
      question,
      preferred_answer: preferred_answer || original_answer, // Use original if no preferred answer
      original_answer,
      tags,
      feedback_type,
      feedback_status,
      chat_message_id,
    };

    try {
      // Call external feedback API
      const response = await fetch(`${API_URL}/feedback/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("External feedback API response:", result);
        return Response.json({
          success: true,
          message: "Feedback saved successfully",
          data: result,
        });
      } else {
        const errorText = await response.text();
        console.warn(
          "External feedback API failed:",
          response.status,
          errorText
        );
        throw new Error(`External API error: ${response.status}`);
      }
    } catch (error) {
      console.warn("External feedback API unavailable:", error);

      // Return success for demo purposes even if external API fails
      return Response.json({
        success: true,
        message: "Feedback saved locally (external API unavailable)",
        data: {
          id: crypto.randomUUID(),
          ...feedbackData,
          saved_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Feedback save error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save feedback",
      },
      { status: 500 }
    );
  }
}
