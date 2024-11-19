import { NextRequest, NextResponse } from "next/server";
import { AggregatedUserRequest, UserMetrics } from "@/types/stats";
import { HeliconeManualLogger } from "@helicone/helpers";
interface HeliconeRequest {
  response_id: string;
  response_created_at: string;
  response_status: number;
  request_created_at: string;
  country_code: string;
  request_user_id: string;
  provider: string;
  request_model: string;
  response_model: string;
  delay_ms: number;
  time_to_first_token: number;
  total_tokens: number | null;
  completion_tokens: number | null;
  prompt_tokens: number | null;
  costUSD: number | null;
}

const logger = new HeliconeManualLogger({
  apiKey: process.env.HELICONE_API_KEY || "",
  headers: {
    "Helicone-Property-Model": "gpt-4o-realtime-preview",
    "Helicone-Property-Temperature": "0.6",
    "Helicone-User-Id": "talk@dustland.ai",
    "Helicone-Property-Provider": "openai",
    "Helicone-Property-App": "talk",
  },
});

export async function POST(request: NextRequest) {
  const { event } = await request.json();
  try {
    const result = await logger.logRequest(
      {
        model: "gpt-4o-realtime-preview",
        temperature: 0.6,
        messages: [
          {
            role: "user",
            content: "(audio transcription)",
          },
        ],
        properties: {
          eventType: event.type,
          sessionId: event.id,
        },
      },
      async (resultRecorder) => {
        resultRecorder.appendResults({
          model: "gpt-4o-realtime-preview",
          status: "success",
          choices: event.response.output.map((choice: any) => {
            return {
              message: {
                role: choice.role,
                content: choice.content[0].transcript, // TODO: fix this
              },
            };
          }),
          created: event.time,
          usage: {
            prompt_tokens: event.response.usage.input_tokens,
            completion_tokens: event.response.usage.output_tokens,
            total_tokens: event.response.usage.total_tokens,
          },
        });
        return event;
      },
      {
        "Helicone-Session-Id": event.id,
        "Helicone-Property-Event-Type": event.type,
        "Helicone-Property-Session-Id": event.id,
      }
    );
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error logging request:", error);
    return NextResponse.json(
      { error: "Failed to log request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const aggregate = searchParams.get("aggregate") === "true";

    const response = await fetch("https://api.helicone.ai/v1/request/query", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HELICONE_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify({
        filter: {
          request: {
            user_id: {
              equals: searchParams.get("user_id") || "talk@dustland.ai",
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    // Filter out failed requests and sort by date
    const validRequests: HeliconeRequest[] = data.data
      .filter((req: HeliconeRequest) => req.response_status === 200)
      .sort(
        (a: HeliconeRequest, b: HeliconeRequest) =>
          new Date(b.request_created_at).getTime() -
          new Date(a.request_created_at).getTime()
      );

    if (validRequests.length === 0) {
      return NextResponse.json(
        { error: "No valid requests found" },
        { status: 404 }
      );
    }

    // Calculate base metrics
    const firstRequest = validRequests[validRequests.length - 1];
    const lastRequest = validRequests[0];

    const totalTokens = validRequests.reduce(
      (sum, req) => sum + (req.total_tokens || 0),
      0
    );

    const totalCost = validRequests.reduce(
      (sum, req) => sum + (req.costUSD || 0),
      0
    );

    const totalPromptTokens = validRequests.reduce(
      (sum, req) => sum + (req.prompt_tokens || 0),
      0
    );

    const totalCompletionTokens = validRequests.reduce(
      (sum, req) => sum + (req.completion_tokens || 0),
      0
    );

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysActive =
      Math.ceil(
        (new Date(lastRequest.request_created_at).getTime() -
          new Date(firstRequest.request_created_at).getTime()) /
          msPerDay
      ) || 1;

    // Aggregate daily metrics if requested
    let daily_metrics: AggregatedUserRequest[] = [];

    if (aggregate) {
      const dailyData = validRequests.reduce(
        (acc: { [key: string]: AggregatedUserRequest }, req) => {
          const date = new Date(req.request_created_at)
            .toISOString()
            .split("T")[0];

          if (!acc[date]) {
            acc[date] = {
              date,
              requests: 0,
              cost: 0,
            };
          }

          acc[date].requests += 1;
          acc[date].cost += req.costUSD || 0;

          return acc;
        },
        {}
      );

      daily_metrics = Object.values(dailyData).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    const metrics: UserMetrics = {
      user_id: firstRequest.request_user_id,
      active_for: daysActive.toString(),
      first_active: firstRequest.request_created_at,
      last_active: lastRequest.request_created_at,
      total_requests: validRequests.length,
      average_requests_per_day_active: validRequests.length / daysActive,
      average_tokens_per_request: totalTokens / validRequests.length,
      total_completion_tokens: totalCompletionTokens,
      total_prompt_tokens: totalPromptTokens,
      cost: totalCost,
      daily_metrics,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
