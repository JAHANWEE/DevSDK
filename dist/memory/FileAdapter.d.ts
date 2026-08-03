import { Message, MemoryAdapter } from "../types";
export declare class FileAdapter implements MemoryAdapter {
    private filePath;
    private cache;
    constructor(filePath?: string);
    private loadFromFile;
    private saveToFile;
    addMessage(sessionId: string, message: Message): Promise<void>;
    getMessages(sessionId: string): Promise<Message[]>;
    clear(sessionId: string): Promise<void>;
}
