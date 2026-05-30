import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
export class SafeCommandTool {
    async run(command) {
        switch (command) {
            case "git_status":
                return this.exec("git", ["status", "--short"]);
            case "ozwarp_audit":
                return this.exec("echo", ["ozwarp", "audit", "status"]);
            case "ollama_list":
                return this.exec("ollama", ["list"]);
            case "repo_tree":
                return this.exec("find", [".", "-maxdepth", "2", "-type", "d"]);
            default:
                return "Command not allowed";
        }
    }
    async exec(cmd, args) {
        try {
            const result = await execFileAsync(cmd, args, {
                cwd: process.cwd(),
                timeout: 15000
            });
            return `${result.stdout}${result.stderr}`;
        }
        catch (err) {
            return `Execution error: ${err.message}`;
        }
    }
}
//# sourceMappingURL=safe-command-tool.js.map