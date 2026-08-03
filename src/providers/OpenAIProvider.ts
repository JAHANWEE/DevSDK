import OpenAI from "openai";
import { zodFunction, zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ModelProvider, Message, Tool } from "../types";

export class OpenAIProvider implements ModelProvider {
  name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(options: { apiKey?: string; model?: string } = {}) {
    this.client = new OpenAI({ apiKey: options.apiKey || process.env.OPENAI_API_KEY });
    this.model = options.model || "gpt-4o-mini";
  }

  async generate(messages: Message[], tools?: Tool[], responseSchema?: z.ZodType<any>): Promise<Message> {
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(msg => {
      if (msg.role === "tool") {
        return {
          role: "tool",
          content: msg.content || "",
          tool_call_id: msg.tool_call_id || "",
        } as OpenAI.Chat.ChatCompletionToolMessageParam;
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
        } as OpenAI.Chat.ChatCompletionAssistantMessageParam;
      }
      return {
        role: msg.role as "user" | "system" | "assistant",
        content: msg.content,
        name: msg.name,
      } as OpenAI.Chat.ChatCompletionMessageParam;
    });

    const openaiTools: OpenAI.Chat.ChatCompletionTool[] | undefined = tools?.map(t => zodFunction({
      name: t.name,
      description: t.description,
      parameters: t.schema as any,
    }) as OpenAI.Chat.ChatCompletionTool);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: formattedMessages,
      tools: openaiTools?.length ? openaiTools : undefined,
      response_format: responseSchema ? zodResponseFormat(responseSchema, "final_answer") : undefined,
    });

    const choice = response.choices[0];
    const message = choice.message;

    return {
      role: "assistant",
      content: message.content,
      tool_calls: message.tool_calls?.map(tc => {
        const func = (tc as any).function;
        return {
          id: tc.id,
          type: "function" as const,
          function: {
            name: func?.name || "",
            arguments: func?.arguments || "",
          }
        };
      })
    };
  }
}
