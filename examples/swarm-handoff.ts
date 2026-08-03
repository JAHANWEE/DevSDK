import { config } from "dotenv";
config();

import { z } from "zod";
import { Agent, Swarm, OpenAIProvider, createTool, HandoffError, AgentConfig } from "../src/index";

async function runSwarmDemo() {
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY, 
    model: "gpt-4o-mini"
  });

  const supportAgentConfig: AgentConfig = {
    name: "TechSupport",
    instructions: "You are a technical support agent. You help users fix computer issues.",
    provider,
  };

  const escalateTool = createTool(
    "escalate_to_support",
    "Transfer the user to a technical support agent.",
    z.object({ reason: z.string() }),
    async ({ reason }) => {
      throw new HandoffError(supportAgentConfig, reason);
    }
  );

  const triageAgentConfig: AgentConfig = {
    name: "TriageBot",
    instructions: "You are a triage agent. If a user has a technical issue, escalate them immediately using the escalate tool.",
    provider,
    tools: [escalateTool]
  };

  const triageAgent = new Agent(triageAgentConfig);
  const swarm = new Swarm(triageAgent, 3); // Max 3 handoffs

  swarm.on("swarm_handoff", (data) => {
    console.log(`\n🔄 [SWARM HANDOFF] From ${data.from} to ${data.to}. Context: ${data.context}`);
  });

  console.log("Starting Swarm Demo...");
  try {
    const result = await swarm.run("My computer won't turn on!");
    console.log("\n✅ Final Result:\n", result);
  } catch (err: any) {
    console.error("Swarm failed:", err.message);
  }
}

runSwarmDemo();
