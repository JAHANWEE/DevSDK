import * as fs from "fs";
import * as path from "path";
import { Message, MemoryAdapter } from "../types";

export class FileAdapter implements MemoryAdapter {
  private filePath: string;
  private cache: Map<string, Message[]>;

  constructor(filePath: string = "./sessions.json") {
    this.filePath = path.resolve(filePath);
    this.cache = new Map();
    this.loadFromFile();
  }

  private loadFromFile() {
    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(data);
        for (const [key, val] of Object.entries(parsed)) {
          this.cache.set(key, val as Message[]);
        }
      } catch (e) {
        console.warn("Failed to read memory file, initializing empty memory.");
      }
    }
  }

  private saveToFile() {
    const obj = Object.fromEntries(this.cache);
    fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), "utf-8");
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    if (!this.cache.has(sessionId)) {
      this.cache.set(sessionId, []);
    }
    this.cache.get(sessionId)!.push(message);
    this.saveToFile();
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return this.cache.get(sessionId) || [];
  }

  async clear(sessionId: string): Promise<void> {
    this.cache.delete(sessionId);
    this.saveToFile();
  }
}
