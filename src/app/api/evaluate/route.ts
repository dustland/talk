import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an IELTS speaking examiner. Evaluate the response based on IELTS criteria and return a JSON response in this exact format:
          {
            "feedback": "detailed feedback here",
            "scores": {
              "fluency": (score between 1-9),
              "lexical": (score between 1-9),
              "grammar": (score between 1-9),
              "pronunciation": (score between 1-9),
              "overall": (average of all scores)
            }
          }`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }
    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate response" },
      { status: 500 }
    );
  }
}
