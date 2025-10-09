export const maxDuration = 30;

// Service class to handle upload and processing
class UploadService {
  async uploadAndProcess(file: File, departmentId: string) {
    console.log(
      `Processing file: ${file.name} for department: ${departmentId}`
    );

    try {
      // Create form data for the external API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("departmentId", departmentId);

      // Send request to the external upload API
      const response = await fetch("http://localhost:3000/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("External API response:", result);

      return result;
    } catch (error) {
      console.error("Error calling external upload API:", error);
      throw new Error(
        `Failed to upload file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

const service = new UploadService();

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const departmentId = String(form.get("departmentId") ?? "general");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Process the uploaded file using external API
    const result = await service.uploadAndProcess(file, departmentId);

    console.log(
      `[Upload API] Processed file: ${file.name} for department: ${departmentId}`
    );

    return Response.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process upload",
      },
      { status: 500 }
    );
  }
}
