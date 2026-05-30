import axios, { AxiosInstance } from 'axios';

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

export class Gemma4Client {
  private client: AxiosInstance;
  private config: GemmaConfig;

  constructor(config: Partial<GemmaConfig> = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:8000',
      timeout: config.timeout || 60000,
      retries: config.retries || 3,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add retry interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalConfig = error.config;
        if (!originalConfig) {
          return Promise.reject(error);
        }
        
        if (!originalConfig.metadata) {
          originalConfig.metadata = { retryCount: 0 };
        }

        originalConfig.metadata.retryCount += 1;

        if (originalConfig.metadata.retryCount <= this.config.retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * originalConfig.metadata.retryCount)
          );
          return this.client(originalConfig);
        }

        return Promise.reject(error);
      }
    );
  }

  async generateStories(
    request: StoryGenerationRequest
  ): Promise<StoryGenerationResponse> {
    try {
      const response = await this.client.post<StoryGenerationResponse>(
        '/api/stories/generate',
        {
          topic: request.topic,
          platforms: request.platforms,
          style: request.style,
          target_audience: request.targetAudience,
          cta: request.cta,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Story generation error:', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<StoryGenerationResponse> {
    try {
      const response = await this.client.get<StoryGenerationResponse>(
        `/api/jobs/${jobId}/status`
      );
      return response.data;
    } catch (error) {
      console.error('Job status error:', error);
      throw error;
    }
  }

  async analyzeVideo(
    request: VideoAnalysisRequest
  ): Promise<VideoAnalysisResponse> {
    try {
      const response = await this.client.post<VideoAnalysisResponse>(
        '/api/video/analyze',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Video analysis error:', error);
      throw error;
    }
  }

  async checkCompliance(
    request: ComplianceCheckRequest
  ): Promise<ComplianceCheckResponse> {
    try {
      const response = await this.client.post<ComplianceCheckResponse>(
        '/api/compliance/check',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Compliance check error:', error);
      throw error;
    }
  }

  async optimizePrompt(
    request: PromptOptimizationRequest
  ): Promise<PromptOptimizationResponse> {
    try {
      const response = await this.client.post<PromptOptimizationResponse>(
        '/api/prompt/optimize',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Prompt optimization error:', error);
      throw error;
    }
  }
}
