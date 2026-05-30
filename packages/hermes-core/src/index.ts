import { OllamaClient } from "./llm/ollama-client.js";
import { SafeCommandTool } from "./tools/safe-command-tool.js";
import { HermesContinuity } from "./memory/continuity.js";

export { OllamaClient, SafeCommandTool, HermesContinuity };

export class HermesAgent {
  private llm = new OllamaClient();
  private commands = new SafeCommandTool();
  private continuity = new HermesContinuity();

  async boot() {
    console.log("Hermes Agent: booting...");
    console.log("Hermes Agent: local LLM target:", process.env.OLLAMA_BASE_URL || "http://localhost:11434");

    this.continuity.track({
      type: "watchful_state",
      context_before: "Hermes startup",
      event_core: "Hermes Agent booted",
      immediate_result: "Runtime initialized",
      followup_focus: "Verify local tools and Ollama model availability"
    });

    const ollamaModels = await this.commands.run("ollama_list");
    console.log("Available Ollama models:");
    console.log(ollamaModels);

    try {
      const response = await this.llm.generate("ตอบสั้น ๆ ภาษาไทยว่า Hermes local agent พร้อมทำงานหรือยัง");
      console.log("LLM response:");
      console.log(response);
    } catch (err: any) {
      console.warn("LLM prompt verification warning:", err.message);
    }
  }
}
