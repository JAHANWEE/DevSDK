import { EventEmitter } from "events";
import { Agent } from "./agent";
export declare class Swarm extends EventEmitter {
    private activeAgent;
    private maxHandoffs;
    constructor(initialAgent: Agent, maxHandoffs?: number);
    run(input: string, sessionId?: string): Promise<string>;
}
