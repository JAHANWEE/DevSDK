import { Guardrail } from "./types";

export async function runInputGuardrails(input: string, guardrails: Guardrail[]): Promise<void> {
  for (const g of guardrails) {
    if (g.validateInput) {
      const result = await g.validateInput(input);
      if (result !== true) {
        throw new Error(`Guardrail '${g.name}' failed on input: ${result}`);
      }
    }
  }
}

export async function runOutputGuardrails(output: string, guardrails: Guardrail[]): Promise<void> {
  for (const g of guardrails) {
    if (g.validateOutput) {
      const result = await g.validateOutput(output);
      if (result !== true) {
        throw new Error(`Guardrail '${g.name}' failed on output: ${result}`);
      }
    }
  }
}
