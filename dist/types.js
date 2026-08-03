"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalError = exports.HandoffError = void 0;
class HandoffError extends Error {
    handoffAgent;
    context;
    constructor(handoffAgent, context) {
        super("Agent requested handoff");
        this.name = "HandoffError";
        this.handoffAgent = handoffAgent;
        this.context = context;
    }
}
exports.HandoffError = HandoffError;
class ApprovalError extends Error {
    constructor(toolName) {
        super(`Execution of tool '${toolName}' was denied.`);
        this.name = "ApprovalError";
    }
}
exports.ApprovalError = ApprovalError;
