import { EventEmitter } from "events";
import { AgentConfig, Message, RunEvent, HandoffError, HandoffRequest, ToolCall } from "./types";
import { runInputGuardrails, runOutputGuardrails } from "./guardrails";

export class Agent extends EventEmitter {
  public config: AgentConfig;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
  }

  private emitEvent(event: RunEvent) {
    this.emit(event.type, event.data);
  }

  async run(input: string, sessionId: string = "default"): Promise<string> {
    this.emitEvent({ type: "run_started", data: { sessionId, input }, timestamp: Date.now() });

    try {
      // 1. Input Guardrails
      if (this.config.guardrails) {
        try {
          await runInputGuardrails(input, this.config.guardrails);
        } catch (e: any) {
          this.emitEvent({ type: "guardrail_triggered", data: { error: e.message }, timestamp: Date.now() });
          throw e;
        }
      }

      // 2. Load Memory
      let messages: Message[] = [];
      if (this.config.memory) {
        messages = await this.config.memory.getMessages(sessionId);
      }
      
      // Inject system instructions if it's the start
      if (messages.length === 0) {
        messages.push({ role: "system", content: this.config.instructions });
        if (this.config.memory) await this.config.memory.addMessage(sessionId, messages[0]);
      }

      // Add user input
      const userMessage: Message = { role: "user", content: input };
      messages.push(userMessage);
      if (this.config.memory) await this.config.memory.addMessage(sessionId, userMessage);

      // 3. Agent Loop
      const maxIterations = 10;
      let iterations = 0;

      while (iterations < maxIterations) {
        iterations++;
        
        // Call LLM
        const responseMessage = await this.config.provider.generate(messages, this.config.tools);
        messages.push(responseMessage);
        if (this.config.memory) await this.config.memory.addMessage(sessionId, responseMessage);

        if (responseMessage.content) {
          this.emitEvent({ type: "text_streamed", data: { text: responseMessage.content }, timestamp: Date.now() });
        }

        // 4. Handle Tool Calls
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          for (const toolCall of responseMessage.tool_calls) {
            this.emitEvent({ type: "tool_started", data: { tool: toolCall.function.name }, timestamp: Date.now() });
            
            const tool = this.config.tools?.find(t => t.name === toolCall.function.name);
            let toolResultStr = "";

            if (!tool) {
              toolResultStr = `Error: Tool '${toolCall.function.name}' not found.`;
            } else {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                const parsedArgs = tool.schema.parse(args); // Zod validation
                
                const result = await tool.execute(parsedArgs);
                toolResultStr = typeof result === "string" ? result : JSON.stringify(result);
              } catch (e: any) {
                if (e instanceof HandoffError) {
                  this.emitEvent({ type: "handoff_started", data: { to: e.handoffAgent.name }, timestamp: Date.now() });
                  throw e; // Bubble up handoffs
                }
                toolResultStr = `Error executing tool: ${e.message}`;
              }
            }

            this.emitEvent({ type: "tool_completed", data: { tool: toolCall.function.name, result: toolResultStr }, timestamp: Date.now() });
            
            const toolMessage: Message = {
              role: "tool",
              content: toolResultStr,
              name: toolCall.function.name,
              tool_call_id: toolCall.id,
            };
            messages.push(toolMessage);
            if (this.config.memory) await this.config.memory.addMessage(sessionId, toolMessage);
          }
        } else {
          // No tool calls, we reached a final answer
          const finalOutput = responseMessage.content || "";

          // 5. Output Guardrails
          if (this.config.guardrails) {
            try {
              await runOutputGuardrails(finalOutput, this.config.guardrails);
            } catch (e: any) {
              this.emitEvent({ type: "guardrail_triggered", data: { error: e.message }, timestamp: Date.now() });
              throw e;
            }
          }

          this.emitEvent({ type: "run_completed", data: { output: finalOutput }, timestamp: Date.now() });
          return finalOutput;
        }
      }

      throw new Error("Agent loop exceeded maximum iterations.");
    } catch (error: any) {
      if (error instanceof HandoffError) {
        throw error;
      }
      this.emitEvent({ type: "run_failed", data: { error: error.message }, timestamp: Date.now() });
      throw error;
    }
  }
}
