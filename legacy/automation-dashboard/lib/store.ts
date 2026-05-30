import { create } from 'zustand';
import { Workflow, WorkflowExecution, Metrics, User } from './api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

interface DashboardState {
  workflows: Workflow[];
  executions: WorkflowExecution[];
  metrics: Metrics | null;
  loading: boolean;
  error: string | null;
  setWorkflows: (workflows: Workflow[]) => void;
  setExecutions: (executions: WorkflowExecution[]) => void;
  setMetrics: (metrics: Metrics) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export const useDashboardStore = create<DashboardState>((set) => ({
  workflows: [],
  executions: [],
  metrics: null,
  loading: false,
  error: null,
  setWorkflows: (workflows) => set({ workflows }),
  setExecutions: (executions) => set({ executions }),
  setMetrics: (metrics) => set({ metrics }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export const useUIStore = create<UIState>((set) => ({
  darkMode: false,
  sidebarOpen: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
