import { config } from "dotenv";
config();

import { z } from "zod";
import { Agent, OpenAIProvider, createTool, InMemoryAdapter } from "./src/index";

async function runDemo() {
  console.log("Initializing DevSDK Demo...");

  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY, 
    model: "gpt-4o-mini"
  });

  const memory = new InMemoryAdapter();

  const getWeather = createTool(
    "get_weather",
    "Get the current weather in a given location",
    z.object({ location: z.string() }),
    async ({ location }) => {
      console.log(`[Tool Executed]: get_weather for ${location}`);
      return { temperature: 72, condition: "Sunny", location };
    }
  );

  const agent = new Agent({
    name: "WeatherBot",
    instructions: "You are a helpful weather assistant. Always use the get_weather tool when asked about the weather.",
    provider,
    memory,
    tools: [getWeather],
    guardrails: [
      {
        name: "No Profanity",
        validateInput: async (input) => !input.toLowerCase().includes("badword") || "Profanity detected in input",
      }
    ]
  });

  // Event Listeners for tracing
  agent.on("run_started", (data) => console.log("\n[Event] run_started:", data.input));
  agent.on("tool_started", (data) => console.log(`[Event] tool_started: ${data.tool}`));
  agent.on("text_streamed", (data) => process.stdout.write(`[Event] text_streamed: ${data.text}\n`));
  agent.on("run_completed", (data) => console.log("\n[Event] run_completed. Final Answer:\n", data.output));
  agent.on("run_failed", (data) => console.error("\n[Event] run_failed:", data.error));
  agent.on("guardrail_triggered", (data) => console.error("\n[Event] guardrail_triggered:", data.error));

  try {
    console.log("--- Turn 1 ---");
    await agent.run("What is the weather in San Francisco?", "demo-session");
    
    console.log("\n--- Turn 2 (Testing Memory) ---");
    await agent.run("Is it hot there?", "demo-session");

    console.log("\n--- Turn 3 (Testing Guardrails) ---");
    await agent.run("This is a badword test.", "demo-session");
    
  } catch (err: any) {
    console.log("\nCaught error in demo script:", err.message);
  }
}

runDemo();
