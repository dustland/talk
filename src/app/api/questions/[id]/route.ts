import { type NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const id = (await params).id;

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching question:", error);
      return Response.json(
        { error: "Failed to fetch question" },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json({ error: "Question not found" }, { status: 404 });
    }

    // Format the response
    const question = {
      id: data.id,
      question: data.question,
      part: data.part,
      topic: data.topic,
      sub_topic: data.sub_topic,
      follow_up_questions: data.follow_up_questions,
      cue_card_points: data.cue_card_points,
    };

    return Response.json(question);
  } catch (error) {
    console.error("Unexpected error:", error);
    return Response.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
