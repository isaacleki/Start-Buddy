import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Step, Session, Stats } from './schemas';
import { generateId, calculateADS } from './utils';

interface AppState {
  // Data
  tasks: Task[];
  steps: Step[];
  sessions: Session[];
  stats: Stats[];

  // Current state
  currentTaskId: string | undefined;
  currentStepId: string | undefined;
  currentSessionId: string | undefined;

  // Task actions
  addTask: (title: string, category?: string) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setCurrentTask: (id: string | undefined) => void;

  // Step actions
  addStep: (taskId: string, text: string, durationMin: 1 | 2, order?: number) => Step;
  updateStep: (id: string, updates: Partial<Step>) => void;
  deleteStep: (id: string) => void;
  reorderSteps: (taskId: string, stepIds: string[]) => void;
  setSteps: (taskId: string, steps: Array<{ text: string; duration_min: 1 | 2 }>) => void;
  setCurrentStep: (id: string | undefined) => void;

  // Session actions
  startSession: (taskId: string, stepId: string, timerMin: number) => Session;
  endSession: (sessionId: string, completed: boolean) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  setCurrentSession: (id: string | undefined) => void;

  // Stats actions
  updateStats: (taskId: string, updates: Partial<Stats>) => void;
  getStats: (taskId: string) => Stats | undefined;
  recordTimeToStart: (taskId: string, ttsMs: number) => void;
  incrementStuckCount: (taskId: string) => void;
  incrementAbandonedCount: (taskId: string) => void;
  incrementCarryovers: (taskId: string) => void;

  // Utility actions
  exportData: () => string;
  deleteAllData: () => void;
  getCurrentTask: () => Task | undefined;
  getCurrentStep: () => Step | undefined;
  getCurrentSession: () => Session | undefined;
  getStepsForTask: (taskId: string) => Step[];
  getNextStep: (taskId: string, currentStepId: string) => Step | undefined;
}

const STORAGE_KEY = 'start-buddy-storage';

export const useStore = create<AppState>()(
  persist(
    (set, get): AppState => ({
      // Initial state
      tasks: [],
      steps: [],
      sessions: [],
      stats: [],
      currentTaskId: undefined,
      currentStepId: undefined,
      currentSessionId: undefined,

      // Task actions
      addTask: (title, category) => {
        const task: Task = {
          id: generateId(),
          title,
          category,
          status: 'pending',
          created_at: Date.now(),
        };
        set((state) => ({
          tasks: [...state.tasks, task],
          currentTaskId: task.id,
        }));
        // Initialize stats
        const stats: Stats = {
          task_id: task.id,
          stuck_count: 0,
          abandoned_count: 0,
          carryovers: 0,
          ads_score: 0,
        };
        set((state) => ({
          stats: [...state.stats, stats],
        }));
        return task;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          steps: state.steps.filter((step) => step.task_id !== id),
          sessions: state.sessions.filter((session) => session.task_id !== id),
          stats: state.stats.filter((stat) => stat.task_id !== id),
          currentTaskId: state.currentTaskId === id ? undefined : state.currentTaskId,
        }));
      },

      setCurrentTask: (id) => {
        set({ currentTaskId: id });
      },

      // Step actions
      addStep: (taskId, text, durationMin, order) => {
        const existingSteps = get().getStepsForTask(taskId);
        const stepOrder = order ?? existingSteps.length;
        const step: Step = {
          id: generateId(),
          task_id: taskId,
          text,
          duration_min: durationMin,
          status: 'pending',
          order: stepOrder,
        };
        set((state) => ({
          steps: [...state.steps, step],
        }));
        return step;
      },

      updateStep: (id, updates) => {
        set((state) => ({
          steps: state.steps.map((step) =>
            step.id === id ? { ...step, ...updates } : step
          ),
        }));
      },

      deleteStep: (id) => {
        set((state) => ({
          steps: state.steps.filter((step) => step.id !== id),
        }));
      },

      reorderSteps: (taskId, stepIds) => {
        set((state) => {
          const steps = state.steps
            .filter((step) => step.task_id === taskId)
            .map((step) => {
              const newOrder = stepIds.indexOf(step.id);
              return newOrder >= 0 ? { ...step, order: newOrder } : step;
            });
          const otherSteps = state.steps.filter((step) => step.task_id !== taskId);
          return { steps: [...otherSteps, ...steps] };
        });
      },

      setSteps: (taskId, stepData) => {
        // Delete existing steps for this task
        set((state) => {
          const otherSteps = state.steps.filter((step) => step.task_id !== taskId);
          const newSteps: Step[] = stepData.map((step, index) => ({
            id: generateId(),
            task_id: taskId,
            text: step.text,
            duration_min: step.duration_min,
            status: 'pending',
            order: index,
          }));
          return { steps: [...otherSteps, ...newSteps] };
        });
      },

      setCurrentStep: (id) => {
        set({ currentStepId: id });
      },

      // Session actions
      startSession: (taskId, stepId, timerMin) => {
        const session: Session = {
          id: generateId(),
          task_id: taskId,
          step_id: stepId,
          timer_min: timerMin,
          started_at: Date.now(),
          stuck_used: false,
          completed: false,
        };
        set((state) => ({
          sessions: [...state.sessions, session],
          currentSessionId: session.id,
        }));
        // Update step status
        get().updateStep(stepId, { status: 'in_progress' });
        // Update task status
        get().updateTask(taskId, { status: 'in_progress' });
        return session;
      },

      endSession: (sessionId, completed) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, ended_at: Date.now(), completed }
              : session
          ),
          currentSessionId: undefined,
        }));
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          if (completed) {
            get().updateStep(session.step_id, { status: 'completed' });
          }
        }
      },

      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...updates } : session
          ),
        }));
      },

      setCurrentSession: (id) => {
        set({ currentSessionId: id });
      },

      // Stats actions
      updateStats: (taskId, updates) => {
        set((state) => {
          const existingStats = state.stats.find((stat) => stat.task_id === taskId);
          if (existingStats) {
            const newStats = { ...existingStats, ...updates };
            // Recalculate ADS score
            newStats.ads_score = calculateADS(newStats);
            return {
              stats: state.stats.map((stat) =>
                stat.task_id === taskId ? newStats : stat
              ),
            };
          } else {
            const newStats: Stats = {
              task_id: taskId,
              stuck_count: 0,
              abandoned_count: 0,
              carryovers: 0,
              ads_score: 0,
              ...updates,
            };
            newStats.ads_score = calculateADS(newStats);
            return {
              stats: [...state.stats, newStats],
            };
          }
        });
        // Also update task ADS score
        const stats = get().getStats(taskId);
        if (stats) {
          get().updateTask(taskId, { ads_score: stats.ads_score });
        }
      },

      getStats: (taskId) => {
        return get().stats.find((stat) => stat.task_id === taskId);
      },

      recordTimeToStart: (taskId, ttsMs) => {
        get().updateStats(taskId, { tts_ms: ttsMs });
      },

      incrementStuckCount: (taskId) => {
        const stats = get().getStats(taskId);
        get().updateStats(taskId, {
          stuck_count: (stats?.stuck_count ?? 0) + 1,
        });
      },

      incrementAbandonedCount: (taskId) => {
        const stats = get().getStats(taskId);
        get().updateStats(taskId, {
          abandoned_count: (stats?.abandoned_count ?? 0) + 1,
        });
      },

      incrementCarryovers: (taskId) => {
        const stats = get().getStats(taskId);
        get().updateStats(taskId, {
          carryovers: (stats?.carryovers ?? 0) + 1,
        });
      },

      // Utility actions
      exportData: () => {
        const state = get();
        return JSON.stringify(
          {
            tasks: state.tasks,
            steps: state.steps,
            sessions: state.sessions,
            stats: state.stats,
          },
          null,
          2
        );
      },

      deleteAllData: () => {
        set({
          tasks: [],
          steps: [],
          sessions: [],
          stats: [],
          currentTaskId: undefined,
          currentStepId: undefined,
          currentSessionId: undefined,
        });
        localStorage.removeItem(STORAGE_KEY);
      },

      getCurrentTask: () => {
        const { currentTaskId, tasks } = get();
        return currentTaskId ? tasks.find((t) => t.id === currentTaskId) : undefined;
      },

      getCurrentStep: () => {
        const { currentStepId, steps } = get();
        return currentStepId ? steps.find((s) => s.id === currentStepId) : undefined;
      },

      getCurrentSession: () => {
        const { currentSessionId, sessions } = get();
        return currentSessionId
          ? sessions.find((s) => s.id === currentSessionId)
          : undefined;
      },

      getStepsForTask: (taskId) => {
        return get()
          .steps.filter((step) => step.task_id === taskId)
          .sort((a, b) => a.order - b.order);
      },

      getNextStep: (taskId, currentStepId) => {
        const steps = get().getStepsForTask(taskId);
        const currentIndex = steps.findIndex((s) => s.id === currentStepId);
        return steps[currentIndex + 1];
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        tasks: state.tasks,
        steps: state.steps,
        sessions: state.sessions,
        stats: state.stats,
        currentTaskId: state.currentTaskId,
        currentStepId: state.currentStepId,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);

