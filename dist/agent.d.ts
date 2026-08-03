import { EventEmitter } from "events";
import { AgentConfig } from "./types";
export declare class Agent extends EventEmitter {
    config: AgentConfig;
    constructor(config: AgentConfig);
    private emitEvent;
    private withRetry;
    run(input: string, sessionId?: string): Promise<string>;
}
