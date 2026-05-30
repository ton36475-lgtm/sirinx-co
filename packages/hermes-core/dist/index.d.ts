import { OllamaClient } from "./llm/ollama-client.js";
import { SafeCommandTool } from "./tools/safe-command-tool.js";
import { HermesContinuity } from "./memory/continuity.js";
export { OllamaClient, SafeCommandTool, HermesContinuity };
export declare class HermesAgent {
    private llm;
    private commands;
    private continuity;
    boot(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map