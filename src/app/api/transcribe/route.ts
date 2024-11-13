// /app/api/transcribe/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { promisify } from "util";
import os from "os";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const accessAsync = promisify(fs.access);

// Function to validate MIME types
const isValidMimeType = (mimeType: string | null): boolean => {
  const allowedMimeTypes = [
    "audio/webm",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "video/mp4",
    "audio/mpga",
  ];
  return mimeType ? allowedMimeTypes.includes(mimeType) : false;
};

export const config = {
  runtime: "nodejs", // Ensures the route runs in a Node.js environment
  api: {
    bodyParser: false, // Disables automatic body parsing to handle multipart/form-data manually
  },
};

export async function POST(req: Request) {
  let tempInputPath = "";

  try {
    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // Validate that a file was uploaded
    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported audio format. Please upload a WebM, WAV, MP3, or MP4 file.",
        },
        { status: 400 }
      );
    }

    // Enforce a maximum file size limit (e.g., 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the maximum allowed limit of 10MB." },
        { status: 400 }
      );
    }

    // Read the file data into a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use the OS's temporary directory for storing files
    const tempDir = os.tmpdir();

    // Generate unique file paths to prevent naming collisions
    tempInputPath = path.join(
      tempDir,
      `${randomUUID()}.${file.type.split("/")[1]}`
    );

    // Write the uploaded file to the temporary input path
    await writeFileAsync(tempInputPath, buffer);

    // Optionally, verify that the file exists and is accessible
    try {
      await accessAsync(tempInputPath, fs.constants.F_OK | fs.constants.R_OK);
    } catch (accessError) {
      throw new Error("Uploaded file is not accessible.");
    }

    // Create a readable stream of the uploaded WebM file
    const fileStream = fs.createReadStream(tempInputPath);

    // Send the WebM file to OpenAI's Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream as any, // Type casting to satisfy TypeScript
      model: "whisper-1",
    });

    // Return the transcription text as a JSON response
    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("Transcription error:", error);

    // If OpenAI API returned an error, log detailed information
    if (error.response) {
      try {
        const errorDetails = await error.response.json();
        console.error("OpenAI API error details:", errorDetails);
      } catch (parseError) {
        console.error("Error parsing OpenAI API error response:", parseError);
      }
    }

    // Return a generic error message for any other failures
    return NextResponse.json(
      {
        error:
          "Failed to transcribe audio. Please ensure the audio file is valid and try again.",
      },
      { status: 500 }
    );
  } finally {
    // Cleanup: Delete temporary files to free up space
    const cleanup = async (filePath: string) => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          await unlinkAsync(filePath);
          console.log(`Deleted temporary file: ${filePath}`);
        } catch (err) {
          console.error(`Failed to delete temporary file ${filePath}:`, err);
        }
      }
    };

    await cleanup(tempInputPath);
  }
}
