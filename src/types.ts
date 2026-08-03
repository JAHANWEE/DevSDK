import { z } from "zod";

export type Role = "user" | "assistant" | "system" | "tool";

export interface Message {
  role: Role;
  content: string | null;
  name?: string; // e.g. tool name
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface Tool<T = any> {
  name: string;
  description: string;
  schema: z.ZodType<T>;
  requiresApproval?: boolean;
  execute: (args: T) => Promise<string | Record<string, any>> | string | Record<string, any>;
}

export interface ModelProvider {
  name: string;
  generate(messages: Message[], tools?: Tool[], responseSchema?: z.ZodType<any>): Promise<Message>;
}

export interface MemoryAdapter {
  addMessage(sessionId: string, message: Message): Promise<void>;
  getMessages(sessionId: string): Promise<Message[]>;
  clear(sessionId: string): Promise<void>;
}

export interface Guardrail<T = any> {
  name: string;
  validateInput?: (input: string) => Promise<boolean | string>; // true if valid, string error if invalid
  validateOutput?: (output: string) => Promise<boolean | string>;
}

export interface RunEvent {
  type: "run_started" | "text_streamed" | "tool_started" | "tool_requires_approval" | "tool_completed" | "handoff_started" | "guardrail_triggered" | "run_completed" | "run_failed";
  data?: any;
  timestamp: number;
}

export interface AgentConfig {
  name: string;
  instructions: string;
  provider: ModelProvider;
  tools?: Tool[];
  guardrails?: Guardrail[];
  memory?: MemoryAdapter;
  responseSchema?: z.ZodType<any>;
  maxRetries?: number;
  timeoutMs?: number;
  approveTool?: (toolName: string, args: any) => Promise<boolean> | boolean;
}

export interface HandoffRequest {
  newAgent: AgentConfig;
  context: string;
}

export class HandoffError extends Error {
  handoffAgent: AgentConfig;
  context: string;
  constructor(handoffAgent: AgentConfig, context: string) {
    super("Agent requested handoff");
    this.name = "HandoffError";
    this.handoffAgent = handoffAgent;
    this.context = context;
  }
}

export class ApprovalError extends Error {
  constructor(toolName: string) {
    super(`Execution of tool '${toolName}' was denied.`);
    this.name = "ApprovalError";
  }
}
