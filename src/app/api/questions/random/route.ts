import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const part = parseInt(searchParams.get("part") || "1");

  try {
    // Replace this with your actual question fetching logic
    const question = {
      id: 1,
      question: "Sample question for part " + part,
      part: part,
      topic: "Sample Topic",
      sub_topic: null,
      follow_up_questions: null,
      cue_card_points: part === 2 ? ["Point 1", "Point 2"] : null,
    };

    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
