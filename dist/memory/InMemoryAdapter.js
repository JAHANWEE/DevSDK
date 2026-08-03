"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAdapter = void 0;
class InMemoryAdapter {
    store;
    constructor() {
        this.store = new Map();
    }
    async addMessage(sessionId, message) {
        if (!this.store.has(sessionId)) {
            this.store.set(sessionId, []);
        }
        this.store.get(sessionId).push(message);
    }
    async getMessages(sessionId) {
        return this.store.get(sessionId) || [];
    }
    async clear(sessionId) {
        this.store.delete(sessionId);
    }
}
exports.InMemoryAdapter = InMemoryAdapter;
