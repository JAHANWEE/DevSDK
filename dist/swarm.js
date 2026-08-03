"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Swarm = void 0;
const events_1 = require("events");
const agent_1 = require("./agent");
const types_1 = require("./types");
class Swarm extends events_1.EventEmitter {
    activeAgent;
    maxHandoffs;
    constructor(initialAgent, maxHandoffs = 5) {
        super();
        this.activeAgent = initialAgent;
        this.maxHandoffs = maxHandoffs;
    }
    async run(input, sessionId = "default") {
        let handoffCount = 0;
        let currentInput = input;
        while (handoffCount <= this.maxHandoffs) {
            try {
                // Run the currently active agent
                const result = await this.activeAgent.run(currentInput, sessionId);
                return result; // If no handoff, return final result
            }
            catch (e) {
                if (e instanceof types_1.HandoffError) {
                    handoffCount++;
                    if (handoffCount > this.maxHandoffs) {
                        throw new Error(`Swarm execution aborted: Maximum handoff limit (${this.maxHandoffs}) reached.`);
                    }
                    this.emit("swarm_handoff", {
                        from: this.activeAgent.config.name,
                        to: e.handoffAgent.name,
                        context: e.context
                    });
                    // Switch the active agent and pass the context
                    this.activeAgent = new agent_1.Agent(e.handoffAgent);
                    currentInput = `[Transferred from previous agent]\nContext: ${e.context}\nUser's Original Request: ${input}`;
                    continue;
                }
                // If it's not a handoff error, bubble it up
                throw e;
            }
        }
        throw new Error("Swarm failed unexpectedly.");
    }
}
exports.Swarm = Swarm;
