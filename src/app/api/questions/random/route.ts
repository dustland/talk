import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const part = parseInt(searchParams.get("part") || "1");

  // Validate part number
  if (![1, 2, 3].includes(part)) {
    return NextResponse.json(
      { error: "Invalid part number. Must be 1, 2, or 3." },
      { status: 400 }
    );
  }

  try {
    // Using the get_random_question function we created in PostgreSQL
    const { data, error } = await supabase.rpc("get_random_question", {
      p_part: part,
    });

    if (error) {
      console.error("Error fetching random question:", error);
      return NextResponse.json(
        { error: "Failed to fetch question" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this part" },
        { status: 404 }
      );
    }

    // Format the response
    const question = {
      id: data[0].id,
      question: data[0].question,
      part: data[0].part,
      topic: data[0].topic,
      sub_topic: data[0].sub_topic,
      follow_up_questions: data[0].follow_up_questions,
      cue_card_points: data[0].cue_card_points,
    };

    return NextResponse.json(question);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
