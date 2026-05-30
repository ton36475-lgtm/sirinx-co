import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  code: string;
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'paused';
  createdAt: string;
  updatedAt: string;
  owner_id: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  started_at: string;
  completed_at: string;
  duration: number;
  error_message?: string;
}

interface Metrics {
  activeWorkflows: number;
  successRate: number;
  pendingTasks: number;
  totalExecutions: number;
  failedExecutions: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await this.client.get<{ status: string }>('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    try {
      const response = await this.client.get<ApiResponse<Workflow[]>>('/api/v1/workflows');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.get<ApiResponse<Workflow>>(`/api/v1/workflows/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createWorkflow(workflow: Partial<Workflow>): Promise<Workflow> {
    try {
      const response = await this.client.post<ApiResponse<Workflow>>('/api/v1/workflows', workflow);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    try {
      const response = await this.client.put<ApiResponse<Workflow>>(`/api/v1/workflows/${id}`, workflow);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    try {
      await this.client.delete(`/api/v1/workflows/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async executeWorkflow(id: string): Promise<WorkflowExecution> {
    try {
      const response = await this.client.post<ApiResponse<WorkflowExecution>>(`/api/v1/workflows/${id}/execute`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Executions
  async getExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    try {
      const params = workflowId ? { workflow_id: workflowId } : {};
      const response = await this.client.get<ApiResponse<WorkflowExecution[]>>('/api/v1/executions', { params });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getExecution(id: string): Promise<WorkflowExecution> {
    try {
      const response = await this.client.get<ApiResponse<WorkflowExecution>>(`/api/v1/executions/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Analytics
  async getMetrics(): Promise<Metrics> {
    try {
      const response = await this.client.get<ApiResponse<Metrics>>('/api/v1/analytics/metrics');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTrends(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<any[]> {
    try {
      const response = await this.client.get<ApiResponse<any[]>>('/api/v1/analytics/trends', {
        params: { time_range: timeRange },
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getEvents(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.client.get<ApiResponse<any[]>>('/api/v1/analytics/events', {
        params: { limit },
      });
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // GitHub
  async getGitHubRepositories(): Promise<any[]> {
    try {
      const response = await this.client.get<ApiResponse<any[]>>('/api/v1/github/repositories');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getGitHubUser(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>('/api/v1/github/user');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const response = await this.client.get<ApiResponse<User[]>>('/api/v1/users');
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      const response = await this.client.get<ApiResponse<User>>(`/api/v1/users/${id}`);
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message || error.message || 'API request failed';
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

export const apiClient = new ApiClient();
export type { Workflow, WorkflowExecution, Metrics, User, ApiResponse };
