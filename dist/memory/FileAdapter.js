"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAdapter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class FileAdapter {
    filePath;
    cache;
    constructor(filePath = "./sessions.json") {
        this.filePath = path.resolve(filePath);
        this.cache = new Map();
        this.loadFromFile();
    }
    loadFromFile() {
        if (fs.existsSync(this.filePath)) {
            try {
                const data = fs.readFileSync(this.filePath, "utf-8");
                const parsed = JSON.parse(data);
                for (const [key, val] of Object.entries(parsed)) {
                    this.cache.set(key, val);
                }
            }
            catch (e) {
                console.warn("Failed to read memory file, initializing empty memory.");
            }
        }
    }
    saveToFile() {
        const obj = Object.fromEntries(this.cache);
        fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), "utf-8");
    }
    async addMessage(sessionId, message) {
        if (!this.cache.has(sessionId)) {
            this.cache.set(sessionId, []);
        }
        this.cache.get(sessionId).push(message);
        this.saveToFile();
    }
    async getMessages(sessionId) {
        return this.cache.get(sessionId) || [];
    }
    async clear(sessionId) {
        this.cache.delete(sessionId);
        this.saveToFile();
    }
}
exports.FileAdapter = FileAdapter;
