export type SafeCommandName = "git_status" | "ozwarp_audit" | "ollama_list" | "repo_tree";
export declare class SafeCommandTool {
    run(command: SafeCommandName): Promise<string>;
    private exec;
}
//# sourceMappingURL=safe-command-tool.d.ts.map