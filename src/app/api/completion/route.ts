import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Create a customized OpenAI provider instance
const openai = createOpenAI({
  baseURL: "https://oai.helicone.ai/v1",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-User-Id": "talk@dustland.ai", // TODO: change this to the user's ID
    "Helicone-Property-App": "talk",
    "Helicone-Stream-Usage": "true",
  },
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  console.log("prompt", prompt);

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `
You are an expert IELTS speaking examiner. Generate a high-quality sample answer (Band 7.0) for the given IELTS speaking question. The answer should demonstrate excellent grammar, coherence, and use a range of vocabulary appropriate for an IELTS speaking test. Ensure the length and depth of the answer are appropriate for the specific part of the test:
- **Part 1**: Provide concise responses, typically 2-3 sentences, focusing on personal experiences or opinions.
- **Part 2**: Deliver a structured monologue lasting 1-2 minutes, covering all aspects of the given topic.
- **Part 3**: Offer detailed and analytical responses, usually 3-4 sentences, discussing abstract ideas or broader issues related to the topic.`,
    prompt,
  });

  return result.toDataStreamResponse();
}

export const runtime = "edge";
