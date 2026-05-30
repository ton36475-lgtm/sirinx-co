import type { ApiError } from '@/types'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

// Active org stored in memory; set via useOrg hook
let activeOrgId: string | null = null

export function setActiveOrgId(id: string | null) {
  activeOrgId = id
}

export function getActiveOrgId(): string | null {
  return activeOrgId
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    super(body.error ?? `HTTP ${status}`)
    this.name = 'ApiClientError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (activeOrgId) {
    headers['X-Org-Id'] = activeOrgId
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let body: ApiError = { error: `HTTP ${res.status}` }
    try {
      body = (await res.json()) as ApiError
    } catch {
      // non-JSON error body
    }
    throw new ApiClientError(res.status, body)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' })
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' })
  },
}

// ─── Endpoint helpers ─────────────────────────────────────────────────────────

import type {
  Org,
  Workspace,
  AgentPack,
  Task,
  TaskDetail,
  Approval,
  BrainEntry,
  Policy,
  BudgetConfig,
  BudgetUsage,
  Provider,
  AuditEvent,
  DashboardStats,
  PaginatedResponse,
} from '@/types'

export const endpoints = {
  // Dashboard
  dashboard: {
    stats: () => api.get<DashboardStats>('/dashboard/stats'),
  },

  // Orgs
  orgs: {
    list: () => api.get<Org[]>('/orgs'),
    get: (id: string) => api.get<Org>(`/orgs/${id}`),
    create: (data: Partial<Org>) => api.post<Org>('/orgs', data),
    update: (id: string, data: Partial<Org>) => api.patch<Org>(`/orgs/${id}`, data),
    delete: (id: string) => api.delete<void>(`/orgs/${id}`),
  },

  // Workspaces
  workspaces: {
    list: (orgId: string) => api.get<Workspace[]>(`/orgs/${orgId}/workspaces`),
    get: (orgId: string, id: string) => api.get<Workspace>(`/orgs/${orgId}/workspaces/${id}`),
    create: (orgId: string, data: Partial<Workspace>) =>
      api.post<Workspace>(`/orgs/${orgId}/workspaces`, data),
    update: (orgId: string, id: string, data: Partial<Workspace>) =>
      api.patch<Workspace>(`/orgs/${orgId}/workspaces/${id}`, data),
    delete: (orgId: string, id: string) => api.delete<void>(`/orgs/${orgId}/workspaces/${id}`),
  },

  // Agent Packs
  packs: {
    list: () => api.get<AgentPack[]>('/packs'),
    get: (id: string) => api.get<AgentPack>(`/packs/${id}`),
    create: (data: Partial<AgentPack>) => api.post<AgentPack>('/packs', data),
    update: (id: string, data: Partial<AgentPack>) => api.patch<AgentPack>(`/packs/${id}`, data),
    delete: (id: string) => api.delete<void>(`/packs/${id}`),
  },

  // Tasks
  tasks: {
    list: (params?: { page?: number; page_size?: number; status?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
      return api.get<PaginatedResponse<Task>>(`/tasks${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => api.get<TaskDetail>(`/tasks/${id}`),
    create: (data: { title: string; description?: string; pack_id?: string }) =>
      api.post<Task>('/tasks', data),
    cancel: (id: string) => api.post<Task>(`/tasks/${id}/cancel`),
  },

  // Approvals
  approvals: {
    list: (status?: string) =>
      api.get<PaginatedResponse<Approval>>(`/approvals${status ? `?status=${status}` : ''}`),
    approve: (id: string, note?: string) => api.post<Approval>(`/approvals/${id}/approve`, { note }),
    reject: (id: string, note?: string) => api.post<Approval>(`/approvals/${id}/reject`, { note }),
  },

  // Brain
  brain: {
    list: (params?: { category?: string; search?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
      return api.get<BrainEntry[]>(`/brain${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => api.get<BrainEntry>(`/brain/${id}`),
    create: (data: Partial<BrainEntry>) => api.post<BrainEntry>('/brain', data),
    update: (id: string, data: Partial<BrainEntry>) =>
      api.patch<BrainEntry>(`/brain/${id}`, data),
    delete: (id: string) => api.delete<void>(`/brain/${id}`),
  },

  // Policies
  policies: {
    list: () => api.get<Policy[]>('/policies'),
    get: (id: string) => api.get<Policy>(`/policies/${id}`),
    create: (data: Partial<Policy>) => api.post<Policy>('/policies', data),
    update: (id: string, data: Partial<Policy>) => api.patch<Policy>(`/policies/${id}`, data),
    delete: (id: string) => api.delete<void>(`/policies/${id}`),
  },

  // Budget
  budget: {
    config: () => api.get<BudgetConfig>('/budget/config'),
    updateConfig: (data: Partial<BudgetConfig>) => api.patch<BudgetConfig>('/budget/config', data),
    usage: (period?: string) =>
      api.get<BudgetUsage>(`/budget/usage${period ? `?period=${period}` : ''}`),
  },

  // Providers
  providers: {
    list: () => api.get<Provider[]>('/providers'),
    get: (id: string) => api.get<Provider>(`/providers/${id}`),
    create: (data: Partial<Provider>) => api.post<Provider>('/providers', data),
    update: (id: string, data: Partial<Provider>) =>
      api.patch<Provider>(`/providers/${id}`, data),
    delete: (id: string) => api.delete<void>(`/providers/${id}`),
  },

  // Audit
  audit: {
    list: (params?: { page?: number; page_size?: number; action?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {})
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
      return api.get<PaginatedResponse<AuditEvent>>(`/audit${qs ? `?${qs}` : ''}`)
    },
  },
}
