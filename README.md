# DevSDK 🚀

[![NPM Version](https://img.shields.io/npm/v/devsdk-core.svg)](https://www.npmjs.com/package/devsdk-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**DevSDK** is the leanest, most reliable open-source AI Agent framework for TypeScript. We built DevSDK for developers who are tired of bloated, overly abstracted frameworks that hide the magic and break in production. 

DevSDK solves the "Agent Reliability Problem" by giving you low-level control over exactly how your agents think, communicate, and fail. If you want to build multi-agent swarms with guaranteed JSON outputs, strict tool-approval guardrails, and persistent memory—without fighting the framework—you are in the right place.

---

## 🔥 Why DevSDK Exists (The Problem it Solves)

Current SDKs are either too basic (just wrapping LLM calls) or too heavy (imposing complex graph routing logic on you). DevSDK bridges the gap. It provides **enterprise-grade reliability** (Retries, Timeouts, Guardrails, Loop Prevention) while keeping the API entirely transparent.

**Why developers adopt DevSDK:**
1. **Type-Safe by Default:** Tools and Structured Outputs are validated via `zod`. If the LLM hallucinates a parameter, it gets caught.
2. **Native Swarm Handoffs:** Agents can dynamically throw `HandoffError`s to seamlessly transfer context to specialized agents, with strict loop-prevention built-in.
3. **True Reliability:** Pre-built exponential backoff retries, tool approval hooks, and granular execution events mean you never lose control in production.

---

## 📦 Installation

```bash
npm install devsdk-core openai zod
```

---

## ⚡ Quick Start: Your First Agent

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
  responseSchema: z.object({ summary: z.string() }) // Enforce structured output!
});

async function main() {
  const result = await agent.run("What is the weather in SF?");
  console.log(result); // Guaranteed to be a JSON string matching responseSchema
}
main();
```

---

## 🚀 Advanced Capabilities

### 1. Multi-Agent Swarms & Handoffs
Don't build one massive prompt. Build targeted agents and let them hand off to each other using the native `Swarm` orchestrator.

```typescript
import { Swarm, HandoffError } from "devsdk-core";

const escalateTool = createTool(
  "escalate", "Transfer to support", z.object({ reason: z.string() }),
  async ({ reason }) => { throw new HandoffError(supportAgentConfig, reason); }
);

// The Swarm orchestrator automatically catches HandoffErrors, 
// transfers the context, and prevents endless loops (max 3 handoffs).
const swarm = new Swarm(triageAgent, 3);
await swarm.run("My computer is broken!");
```

### 2. Strict Tool Guardrails (Human-in-the-loop)
Need a human to approve an action before the agent pulls the trigger? Just set `requiresApproval: true`.

```typescript
const agent = new Agent({
  // ...
  approveTool: async (toolName, args) => {
    console.log(`Agent wants to run ${toolName} with`, args);
    return true; // Or false to throw an ApprovalError and stop the agent
  }
});
```

### 3. Persistent Memory Out-of-the-box
Use `FileAdapter` to instantly persist multi-turn sessions to disk, or `InMemoryAdapter` for fast ephemeral testing.

```typescript
import { FileAdapter } from "devsdk-core";
const memory = new FileAdapter("./memory.json");
const agent = new Agent({ /* ... */ memory });
```

---

## 🛠 Features Overview
- ✅ **Agent Runtime:** Multi-turn loop, automatic tool execution, safe limits.
- ✅ **Tools:** Async execution, Zod validation, Human approval hooks.
- ✅ **Handoffs:** `Swarm` orchestration with loop prevention.
- ✅ **Guardrails:** Pre/post execution validation.
- ✅ **Memory:** `FileAdapter` and `InMemoryAdapter`.
- ✅ **Reliability:** Exponential backoff retries, explicit timeouts.
- ✅ **Structured Output:** Enforced JSON schema generation.
- ✅ **Tracing:** Deep `EventEmitter` hooks (`text_streamed`, `tool_started`, etc).

## License
MIT
