import { Message, MemoryAdapter } from "../types";
export declare class InMemoryAdapter implements MemoryAdapter {
    private store;
    constructor();
    addMessage(sessionId: string, message: Message): Promise<void>;
    getMessages(sessionId: string): Promise<Message[]>;
    clear(sessionId: string): Promise<void>;
}
