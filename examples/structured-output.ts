import { Agent, OpenAIProvider } from "../src";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY as string,
  model: "gpt-4o-mini"
});

const extractionAgent = new Agent({
  name: "DataExtractor",
  instructions: "You extract key information from unstructured text and return it exactly matching the requested JSON schema. Do not include markdown formatting.",
  provider,
  responseSchema: z.object({
    sentiment: z.enum(["Positive", "Neutral", "Negative"]),
    keyThemes: z.array(z.string()),
    urgencyLevel: z.number().min(1).max(5)
  })
});

async function run() {
  console.log("Analyzing customer review...");
  const text = "I am incredibly frustrated with this service. The app crashes every time I try to check out, and support hasn't answered my email in 3 days. Fix this immediately!";
  
  const resultStr = await extractionAgent.run(text);
  const result = JSON.parse(resultStr);
  
  console.log("\nStructured Output Received:");
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
