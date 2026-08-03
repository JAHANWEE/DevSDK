# devsdk-core

A lean, reliable TypeScript framework for building LLM agents. 

Unlike heavy orchestrators, `devsdk-core` gives you low-level primitives for agents, tools, memory, and swarms without getting in your way. It focuses on production reliability: retries, timeouts, strict schema validation, and human-in-the-loop approvals.

## Installation

```bash
npm install devsdk-core openai zod
```

## Quick Start

```typescript
import { z } from "zod";
import { Agent, OpenAIProvider, createTool } from "devsdk-core";

const provider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });

const getWeather = createTool(
  "get_weather",
  "Get the current weather",
  z.object({ location: z.string() }),
  async ({ location }) => ({ temp: 72, condition: "Sunny", location })
);

const agent = new Agent({
  name: "WeatherBot",
  instructions: "You are a helpful weather assistant.",
  provider,
  tools: [getWeather],
  responseSchema: z.object({ summary: z.string() }) // Enforces structured JSON output
});

async function main() {
  const result = await agent.run("What is the weather in SF?");
  console.log(result); // Guaranteed to match responseSchema
}
main();
```

## Core Concepts

### Multi-Agent Swarms
Build specialized agents and orchestrate handoffs using `Swarm`.

```typescript
import { Swarm, HandoffError } from "devsdk-core";

const escalateTool = createTool(
  "escalate", 
  "Transfer to support", 
  z.object({ reason: z.string() }),
  async ({ reason }) => { throw new HandoffError(supportAgentConfig, reason); }
);

// Swarm catches HandoffErrors, transfers context, and prevents infinite loops.
const swarm = new Swarm(triageAgent, 3);
await swarm.run("My computer is broken!");
```

### Human-in-the-Loop (Tool Approvals)
Require explicit approval before executing sensitive tools.

```typescript
const agent = new Agent({
  // ...
  approveTool: async (toolName, args) => {
    console.log(`Agent wants to run ${toolName} with`, args);
    return true; // Return false to block execution and throw ApprovalError
  }
});
```

### Memory
Keep context across turns. Comes with `FileAdapter` and `InMemoryAdapter`.

```typescript
import { FileAdapter } from "devsdk-core";

const memory = new FileAdapter("./memory.json");
const agent = new Agent({ /* ... */ memory });
```

## Features
- **Type-safe:** Built on Zod for tool parsing and structured outputs.
- **Reliable:** Configurable LLM retries and timeouts out-of-the-box.
- **Event-driven:** Hook into the agent loop with granular events (`tool_started`, `text_streamed`, etc).
- **Handoffs:** Predictable multi-agent routing using error boundaries.

## License
MIT
