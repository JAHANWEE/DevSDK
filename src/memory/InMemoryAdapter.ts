import { Message, MemoryAdapter } from "../types";

export class InMemoryAdapter implements MemoryAdapter {
  private store: Map<string, Message[]>;

  constructor() {
    this.store = new Map();
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    if (!this.store.has(sessionId)) {
      this.store.set(sessionId, []);
    }
    this.store.get(sessionId)!.push(message);
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return this.store.get(sessionId) || [];
  }

  async clear(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }
}
