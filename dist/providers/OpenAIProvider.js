"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("openai/helpers/zod");
class OpenAIProvider {
    name = "openai";
    client;
    model;
    constructor(options = {}) {
        this.client = new openai_1.default({ apiKey: options.apiKey || process.env.OPENAI_API_KEY });
        this.model = options.model || "gpt-4o-mini";
    }
    async generate(messages, tools) {
        const formattedMessages = messages.map(msg => {
            if (msg.role === "tool") {
                return {
                    role: "tool",
                    content: msg.content || "",
                    tool_call_id: msg.tool_call_id || "",
                };
            }
            if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
                return {
                    role: "assistant",
                    content: msg.content,
                    tool_calls: msg.tool_calls.map(tc => ({
                        id: tc.id,
                        type: "function",
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments,
                        }
                    }))
                };
            }
            return {
                role: msg.role,
                content: msg.content,
                name: msg.name,
            };
        });
        const openaiTools = tools?.map(t => (0, zod_1.zodFunction)({
            name: t.name,
            description: t.description,
            parameters: t.schema,
        }));
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: formattedMessages,
            tools: openaiTools?.length ? openaiTools : undefined,
        });
        const choice = response.choices[0];
        const message = choice.message;
        return {
            role: "assistant",
            content: message.content,
            tool_calls: message.tool_calls?.map(tc => {
                const func = tc.function;
                return {
                    id: tc.id,
                    type: "function",
                    function: {
                        name: func?.name || "",
                        arguments: func?.arguments || "",
                    }
                };
            })
        };
    }
}
exports.OpenAIProvider = OpenAIProvider;
