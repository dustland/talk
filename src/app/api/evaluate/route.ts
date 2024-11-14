import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

export async function POST(req: Request) {
  try {
    const { answer } = await req.json();
    if (!answer) {
      return NextResponse.json(
        { error: "No answer provided" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert IELTS speaking examiner. Your task is to evaluate the given response based on the official IELTS speaking criteria. Please provide a detailed JSON response in the following format:

          {
            "feedback": "Provide comprehensive feedback on the response, highlighting strengths and areas for improvement. Focus on aspects such as coherence, vocabulary usage, grammatical accuracy, and pronunciation.",
            "scores": {
              "fluency": (integer or x.5 score between 1 and 9, e.g., 5.0, 5.5, 6.0, 6.5),
              "lexical": (integer or x.5 score between 1 and 9, e.g., 5.0, 5.5, 6.0, 6.5),
              "grammar": (integer or x.5 score between 1 and 9, e.g., 5.0, 5.5, 6.0, 6.5),
              "pronunciation": (integer or x.5 score between 1 and 9, e.g., 5.0, 5.5, 6.0, 6.5),
              "overall": (average of the above scores, rounded to nearest 0.5, following IELTS band score convention)
            },
            "reference": "Provide a model reference answer that would achieve an IELTS band score of 7.5, demonstrating high proficiency in all evaluated areas, but avoid using advanced vocabulary or complex grammar."
          }

          Important: All scores MUST follow the official IELTS band scoring system:
          - Scores can only be whole numbers (e.g., 5.0, 6.0) or half numbers (e.g., 5.5, 6.5)
          - No other decimal places are allowed (e.g., 5.3, 6.7 are invalid)
          - The overall score must be rounded to the nearest 0.5 with the official rounding rules
          - Valid scores are: 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0`,
        },
        {
          role: "user",
          content: answer,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    console.log(completion);
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
