"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInputGuardrails = runInputGuardrails;
exports.runOutputGuardrails = runOutputGuardrails;
async function runInputGuardrails(input, guardrails) {
    for (const g of guardrails) {
        if (g.validateInput) {
            const result = await g.validateInput(input);
            if (result !== true) {
                throw new Error(`Guardrail '${g.name}' failed on input: ${result}`);
            }
        }
    }
}
async function runOutputGuardrails(output, guardrails) {
    for (const g of guardrails) {
        if (g.validateOutput) {
            const result = await g.validateOutput(output);
            if (result !== true) {
                throw new Error(`Guardrail '${g.name}' failed on output: ${result}`);
            }
        }
    }
}
