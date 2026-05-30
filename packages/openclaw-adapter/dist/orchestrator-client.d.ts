export type TaskType = 'code_generation' | 'code_review' | 'debugging' | 'creative_content_th' | 'seo_content' | 'summarize' | 'research';
export interface RouteOptions {
    taskType?: TaskType;
    costOptimize?: boolean;
    exclude?: string[];
}
export interface ParallelTask {
    id: string;
    task: string;
    model?: string;
}
export interface CascadeOptions {
    chain: string[];
}
export interface CritiqueOptions {
    drafter: string;
    reviewer: string;
    maxIterations?: number;
}
export interface OrchestratorConfig {
    apiUrl: string;
    timeout: number;
}
export declare const TASK_MODEL_MAP: Record<TaskType, string[]>;
export declare class OpenClawOrchestrator {
    private client;
    private config;
    constructor(config?: Partial<OrchestratorConfig>);
    /**
     * Route a task to the best available model
     */
    route(task: string, options?: RouteOptions): Promise<any>;
    /**
     * Execute multiple tasks in parallel
     */
    parallel(tasks: ParallelTask[]): Promise<any>;
    /**
     * Cascade tasks sequentially through a list of models
     */
    cascade(task: string, options: CascadeOptions): Promise<any>;
    /**
     * Run a critique loop between drafter and reviewer models
     */
    critique(task: string, options: CritiqueOptions): Promise<any>;
    private detectTaskType;
}
//# sourceMappingURL=orchestrator-client.d.ts.map