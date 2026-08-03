"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const events_1 = require("events");
const types_1 = require("./types");
const guardrails_1 = require("./guardrails");
class Agent extends events_1.EventEmitter {
    config;
    constructor(config) {
        super();
        this.config = config;
    }
    emitEvent(event) {
        this.emit(event.type, event.data);
    }
    async withRetry(fn) {
        const maxRetries = this.config.maxRetries ?? 3;
        const timeoutMs = this.config.timeoutMs ?? 30000;
        let attempt = 0;
        while (attempt <= maxRetries) {
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Provider call timed out")), timeoutMs));
                return await Promise.race([fn(), timeoutPromise]);
            }
            catch (e) {
                attempt++;
                if (attempt > maxRetries)
                    throw e;
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // Exponential backoff
            }
        }
        throw new Error("Max retries exceeded");
    }
    async run(input, sessionId = "default") {
        this.emitEvent({ type: "run_started", data: { sessionId, input }, timestamp: Date.now() });
        try {
            // 1. Input Guardrails
            if (this.config.guardrails) {
                try {
                    await (0, guardrails_1.runInputGuardrails)(input, this.config.guardrails);
                }
                catch (e) {
                    this.emitEvent({ type: "guardrail_triggered", data: { error: e.message }, timestamp: Date.now() });
                    throw e;
                }
            }
            // 2. Load Memory
            let messages = [];
            if (this.config.memory) {
                messages = await this.config.memory.getMessages(sessionId);
            }
            // Inject system instructions if it's the start
            if (messages.length === 0) {
                messages.push({ role: "system", content: this.config.instructions });
                if (this.config.memory)
                    await this.config.memory.addMessage(sessionId, messages[0]);
            }
            // Add user input
            const userMessage = { role: "user", content: input };
            messages.push(userMessage);
            if (this.config.memory)
                await this.config.memory.addMessage(sessionId, userMessage);
            // 3. Agent Loop
            const maxIterations = 10;
            let iterations = 0;
            while (iterations < maxIterations) {
                iterations++;
                // Call LLM with Retries & Timeouts & Structured Outputs
                const responseMessage = await this.withRetry(() => this.config.provider.generate(messages, this.config.tools, this.config.responseSchema));
                messages.push(responseMessage);
                if (this.config.memory)
                    await this.config.memory.addMessage(sessionId, responseMessage);
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
                        }
                        else {
                            try {
                                const args = JSON.parse(toolCall.function.arguments);
                                const parsedArgs = tool.schema.parse(args); // Zod validation
                                // Tool Approval Guardrail
                                if (tool.requiresApproval) {
                                    this.emitEvent({ type: "tool_requires_approval", data: { tool: tool.name, args: parsedArgs }, timestamp: Date.now() });
                                    if (!this.config.approveTool) {
                                        throw new types_1.ApprovalError(tool.name);
                                    }
                                    const isApproved = await this.config.approveTool(tool.name, parsedArgs);
                                    if (!isApproved) {
                                        throw new types_1.ApprovalError(tool.name);
                                    }
                                }
                                const result = await tool.execute(parsedArgs);
                                toolResultStr = typeof result === "string" ? result : JSON.stringify(result);
                            }
                            catch (e) {
                                if (e instanceof types_1.HandoffError) {
                                    this.emitEvent({ type: "handoff_started", data: { to: e.handoffAgent.name }, timestamp: Date.now() });
                                    throw e; // Bubble up handoffs
                                }
                                toolResultStr = `Error executing tool: ${e.message}`;
                            }
                        }
                        this.emitEvent({ type: "tool_completed", data: { tool: toolCall.function.name, result: toolResultStr }, timestamp: Date.now() });
                        const toolMessage = {
                            role: "tool",
                            content: toolResultStr,
                            name: toolCall.function.name,
                            tool_call_id: toolCall.id,
                        };
                        messages.push(toolMessage);
                        if (this.config.memory)
                            await this.config.memory.addMessage(sessionId, toolMessage);
                    }
                }
                else {
                    // No tool calls, final answer produced
                    const finalOutput = responseMessage.content || "";
                    // 5. Output Guardrails
                    if (this.config.guardrails) {
                        try {
                            await (0, guardrails_1.runOutputGuardrails)(finalOutput, this.config.guardrails);
                        }
                        catch (e) {
                            this.emitEvent({ type: "guardrail_triggered", data: { error: e.message }, timestamp: Date.now() });
                            throw e;
                        }
                    }
                    this.emitEvent({ type: "run_completed", data: { output: finalOutput }, timestamp: Date.now() });
                    return finalOutput;
                }
            }
            throw new Error("Agent loop exceeded maximum iterations.");
        }
        catch (error) {
            if (error instanceof types_1.HandoffError) {
                throw error;
            }
            this.emitEvent({ type: "run_failed", data: { error: error.message }, timestamp: Date.now() });
            throw error;
        }
    }
}
exports.Agent = Agent;
