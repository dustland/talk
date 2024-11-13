import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Ensure the Blob is valid
    if (audioFile.size === 0) {
      return NextResponse.json({ error: "Empty audio file" }, { status: 400 });
    }

    // Create a File object that OpenAI can process
    const file = new File([audioFile], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });

    return NextResponse.json({ text: transcription });
  } catch (error: any) {
    console.error("Transcription error:", error);

    // Check for specific error details
    if (error.response) {
      const errorDetails = await error.response.json();
      console.error("OpenAI API error details:", errorDetails);
    }

    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
