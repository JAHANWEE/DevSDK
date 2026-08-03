import { EventEmitter } from "events";
import { Agent } from "./agent";
import { HandoffError } from "./types";

export class Swarm extends EventEmitter {
  private activeAgent: Agent;
  private maxHandoffs: number;

  constructor(initialAgent: Agent, maxHandoffs: number = 5) {
    super();
    this.activeAgent = initialAgent;
    this.maxHandoffs = maxHandoffs;
  }

  async run(input: string, sessionId: string = "default"): Promise<string> {
    let handoffCount = 0;
    let currentInput = input;

    while (handoffCount <= this.maxHandoffs) {
      try {
        // Run the currently active agent
        const result = await this.activeAgent.run(currentInput, sessionId);
        return result; // If no handoff, return final result
      } catch (e: any) {
        if (e instanceof HandoffError) {
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
          this.activeAgent = new Agent(e.handoffAgent);
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
