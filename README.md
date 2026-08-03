# DevSDK

[![NPM Version](https://img.shields.io/npm/v/devsdk-core.svg)](https://www.npmjs.com/package/devsdk-core)

DevSDK is an open-source AI Agent framework written in TypeScript. Build powerful multi-agent systems with type-safe tools, multi-turn sessions, streaming, and full guardrails support.

**This project is officially published and available as an NPM package at [`devsdk-core`](https://www.npmjs.com/package/devsdk-core).**

## Installation

```bash
npm install devsdk-core openai zod
```

## Quick Start

```typescript
import { z } from "zod";
import { Agent, OpenAIProvider, createTool } from "devsdk-core";

const provider = new OpenAIProvider({ apiKey: "YOUR_API_KEY" });

const getWeather = createTool(
  "get_weather",
  "Get the current weather in a given location",
  z.object({ location: z.string() }),
  async ({ location }) => {
    return { temperature: 72, condition: "Sunny", location };
  }
);

const agent = new Agent({
  name: "WeatherBot",
  instructions: "You are a helpful weather assistant.",
  provider,
  tools: [getWeather],
});

agent.on("text_streamed", (data) => process.stdout.write(data.text));

async function main() {
  const result = await agent.run("What is the weather in San Francisco?");
  console.log("\n\nFinal Output:", result);
}
main();
```

## Features

### 1. Agents & Tools
Define agents with specialized instructions, memory adapters, and tools. Tools are fully typed via Zod schemas, enforcing structured outputs at runtime.

### 2. Multi-Agent Handoffs
Agents can request a handoff by throwing a `HandoffError`. DevSDK will catch this in the outer loop or you can handle it directly.

```typescript
import { HandoffError } from "devsdk-core";

const escalateTool = createTool(
  "escalate_to_human",
  "Escalate the issue to a human agent.",
  z.object({ reason: z.string() }),
  async ({ reason }) => {
    throw new HandoffError(humanAgentConfig, reason);
  }
);
```

### 3. Guardrails
Add pre-execution and post-execution validation to ensure safety.

```typescript
const agent = new Agent({
  // ...
  guardrails: [
    {
      name: "No Profanity",
      validateInput: async (input) => !input.includes("badword") || "Profanity detected",
      validateOutput: async (output) => !output.includes("badword") || "Profanity detected",
    }
  ]
});
```

### 4. Memory & Sessions
Multi-turn conversations are handled seamlessly. Use `InMemoryAdapter` or build your own for Redis/Postgres persistence.

### 5. Events & Tracing
Listen to real-time events like `run_started`, `tool_started`, `text_streamed`, `tool_completed`, and `run_completed`.

## License
MIT
