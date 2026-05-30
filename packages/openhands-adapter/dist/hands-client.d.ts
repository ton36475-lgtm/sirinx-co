export interface HandsConfig {
    workspaceDir: string;
    apiUrl: string;
    timeout: number;
    sandboxMode: 'local_process' | 'isolated_container';
}
export interface WorkspaceState {
    workspaceId: string;
    mountedPath: string;
    activeTasks: number;
}
export interface ExecutionResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
}
export declare class OpenHandsAdapter {
    private client;
    private config;
    constructor(config?: Partial<HandsConfig>);
    /**
     * Initializes a sandboxed local-only workspace folder
     */
    createWorkspace(workspaceId: string): Promise<WorkspaceState>;
    /**
     * Safely executes standard sandboxed terminal commands matching M2 control rules
     */
    executeCommand(workspaceId: string, command: string): Promise<ExecutionResult>;
    /**
     * Trigger a scoped execution of the OpenHands AI agent on a specified path
     */
    runAgentTask(workspaceId: string, prompt: string, agentName?: string): Promise<any>;
}
//# sourceMappingURL=hands-client.d.ts.map