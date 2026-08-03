import { Guardrail } from "./types";
export declare function runInputGuardrails(input: string, guardrails: Guardrail[]): Promise<void>;
export declare function runOutputGuardrails(output: string, guardrails: Guardrail[]): Promise<void>;
