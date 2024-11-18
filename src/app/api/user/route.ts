const HELICONE_API_URL = "https://api.helicone.ai/v1/user/query";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userId = "talk@dustland.ai";
    const timeFilter = {
      startTimeUnixSeconds: Math.floor(new Date().setDate(1) / 1000), // Start of current month
      endTimeUnixSeconds: Math.floor(Date.now() / 1000), // Current time
    };

    const response = await fetch(HELICONE_API_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HELICONE_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify({
        userIds: [userId],
        // timeFilter,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      timeFilter,
      data: data.data,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
