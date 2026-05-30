export interface GemmaConfig {
    apiUrl: string;
    timeout: number;
    retries: number;
}
export interface StoryGenerationRequest {
    topic: string;
    platforms: string[];
    style: string;
    targetAudience: string;
    cta: string;
}
export interface StoryGenerationResponse {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    stories?: any[];
    error?: string;
}
export interface VideoAnalysisRequest {
    videoUrl: string;
    transcript: string;
}
export interface VideoAnalysisResponse {
    keyThemes: string[];
    emotionalMoments: any[];
    engagementOpportunities: string[];
}
export interface ComplianceCheckRequest {
    content: string;
    guidelines: Record<string, any>;
}
export interface ComplianceCheckResponse {
    compliant: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
}
export interface PromptOptimizationRequest {
    prompt: string;
    context: Record<string, any>;
}
export interface PromptOptimizationResponse {
    optimizedPrompt: string;
    improvements: string[];
}
export declare class Gemma4Client {
    private client;
    private config;
    constructor(config?: Partial<GemmaConfig>);
    generateStories(request: StoryGenerationRequest): Promise<StoryGenerationResponse>;
    getJobStatus(jobId: string): Promise<StoryGenerationResponse>;
    analyzeVideo(request: VideoAnalysisRequest): Promise<VideoAnalysisResponse>;
    checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceCheckResponse>;
    optimizePrompt(request: PromptOptimizationRequest): Promise<PromptOptimizationResponse>;
}
//# sourceMappingURL=gemma-client.d.ts.map