import { ModelProvider, Message, Tool } from "../types";
export declare class OpenAIProvider implements ModelProvider {
    name: string;
    private client;
    private model;
    constructor(options?: {
        apiKey?: string;
        model?: string;
    });
    generate(messages: Message[], tools?: Tool[]): Promise<Message>;
}
