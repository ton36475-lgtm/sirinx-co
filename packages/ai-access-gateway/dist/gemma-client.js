import axios from 'axios';
export class Gemma4Client {
    client;
    config;
    constructor(config = {}) {
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
        this.client.interceptors.response.use((response) => response, async (error) => {
            const originalConfig = error.config;
            if (!originalConfig) {
                return Promise.reject(error);
            }
            if (!originalConfig.metadata) {
                originalConfig.metadata = { retryCount: 0 };
            }
            originalConfig.metadata.retryCount += 1;
            if (originalConfig.metadata.retryCount <= this.config.retries) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * originalConfig.metadata.retryCount));
                return this.client(originalConfig);
            }
            return Promise.reject(error);
        });
    }
    async generateStories(request) {
        try {
            const response = await this.client.post('/api/stories/generate', {
                topic: request.topic,
                platforms: request.platforms,
                style: request.style,
                target_audience: request.targetAudience,
                cta: request.cta,
            });
            return response.data;
        }
        catch (error) {
            console.error('Story generation error:', error);
            throw error;
        }
    }
    async getJobStatus(jobId) {
        try {
            const response = await this.client.get(`/api/jobs/${jobId}/status`);
            return response.data;
        }
        catch (error) {
            console.error('Job status error:', error);
            throw error;
        }
    }
    async analyzeVideo(request) {
        try {
            const response = await this.client.post('/api/video/analyze', request);
            return response.data;
        }
        catch (error) {
            console.error('Video analysis error:', error);
            throw error;
        }
    }
    async checkCompliance(request) {
        try {
            const response = await this.client.post('/api/compliance/check', request);
            return response.data;
        }
        catch (error) {
            console.error('Compliance check error:', error);
            throw error;
        }
    }
    async optimizePrompt(request) {
        try {
            const response = await this.client.post('/api/prompt/optimize', request);
            return response.data;
        }
        catch (error) {
            console.error('Prompt optimization error:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=gemma-client.js.map