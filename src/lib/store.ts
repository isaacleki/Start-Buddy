'use client';

import { create } from 'zustand';
import { getSplitPair } from '@/lib/step-helpers';

export type StepStatus = 'todo' | 'doing' | 'done';
export type Category = 'work' | 'personal' | 'hobby' | 'health';

export interface TaskStep {
  id: string;
  text: string;
  duration_min: number;
  status: StepStatus;
  order: number;
}

export interface SurveyInput {
  ease: number;
  energyBefore: number;
  energyAfter: number;
  distractions: 'none' | 'some' | 'many';
  note?: string;
}

export interface SessionSummary {
  ease: number;
  energyBefore: number;
  energyAfter: number;
  deltaEnergy: number;
  distractions: 'none' | 'some' | 'many';
  feltEasy: boolean;
  note?: string;
}

interface AutoStartTimer {
  minutes: number;
  message?: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  steps: TaskStep[];
  activeStepId: string | null;
  streak: number;
  lastEncouragement?: string;
  summary?: SessionSummary;
  createdAt: number;
  completedAt?: number;
}

interface Templates {
  id: string;
  title: string;
  category: Category;
  steps: Array<{ text: string; duration_min: number }>;
}

const TASK_TEMPLATES: Templates[] = [
  {
    id: 'morning-prep',
    title: 'Get ready for work',
    category: 'personal',
    steps: [
      {
        text: 'Open wardrobe & set out outfit (top/bottom/socks/underwear)',
        duration_min: 2,
      },
      { text: 'Put on outfit (clothes only)', duration_min: 2 },
      { text: 'Bathroom quick: brush teeth + face splash', duration_min: 2 },
      { text: 'Pack essentials: phone/wallet/keys + ID/badge + water', duration_min: 2 },
      { text: 'Shoes on, grab bag, lock door', duration_min: 2 },
    ],
  },
];

let idCounter = 0;
const createId = (prefix: string) => `${prefix}-${++idCounter}`;

function buildSteps(templateSteps: Templates['steps']): { steps: TaskStep[]; activeStepId: string | null } {
  const steps = templateSteps.map((step, index) => {
    const status: StepStatus = index === 0 ? 'doing' : 'todo';
    return {
      id: createId('step'),
      text: step.text,
      duration_min: step.duration_min,
      status,
      order: index,
    };
  });
  return {
    steps,
    activeStepId: steps[0]?.id ?? null,
  };
}

function pickEncouragement(completed: number, total: number): string {
  if (completed === 0) {
    return 'First step ready—let’s make it light and doable.';
  }
  if (completed >= total) {
    return 'All steps wrapped up. Nicely done!';
  }
  const messages = [
    'Nice momentum—keep it easy and steady.',
    'Another micro-step in the win column.',
    'Streak growing. Next move is ready when you are.',
    'Progress feels good—enjoy the shift.',
  ];
  return messages[completed % messages.length];
}

interface AppState {
  tasks: Task[];
  activeTaskId: string | null;
  lastCreatedTaskId: string | null;
  autoStartTimer: AutoStartTimer | null;
  showSurveyFor: string | null;
  lastEncouragement: string;

  createTaskFromTemplate: (templateId: string, overrides?: { title?: string; category?: Category }) => string;
  createTaskFromSteps: (title: string, category: Category, steps: Array<{ text: string; duration_min: number }>) => string;
  setActiveTask: (taskId: string | null) => void;
  markStepDone: () => void;
  splitCurrentStep: (
    parts?: [string, string],
    options?: { autoStartMinutes?: number; message?: string }
  ) => void;
  insertHelperStep: (
    helper: { text: string; duration_min: number },
    options?: { autoStartMinutes?: number; message?: string }
  ) => void;
  triggerLowEnergy: (message?: string) => void;
  acknowledgeAutoStart: () => void;
  updateStepText: (taskId: string, stepId: string, text: string) => void;
  updateStepDuration: (taskId: string, stepId: string, minutes: number) => void;
  moveStep: (taskId: string, stepId: string, direction: 'up' | 'down') => void;
  addStep: (taskId: string, afterStepId?: string) => string | null;
  deleteStep: (taskId: string, stepId: string) => void;
  saveSurvey: (taskId: string, input: SurveyInput) => void;
  closeSurvey: () => void;
  triggerSurvey: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  resetScenario: () => void;
}

const initialEncouragement = 'Ready when you are.';

function createMockCompletedTasks(): Task[] {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  return [
    {
      id: 'mock-1',
      title: 'Set up morning routine',
      category: 'personal',
      steps: [
        { id: 's1', text: 'Set alarm for 7:00 AM', duration_min: 1, status: 'done' as StepStatus, order: 0 },
        { id: 's2', text: 'Lay out clothes the night before', duration_min: 2, status: 'done' as StepStatus, order: 1 },
        { id: 's3', text: 'Prepare breakfast items', duration_min: 3, status: 'done' as StepStatus, order: 2 },
        { id: 's4', text: 'Write morning checklist', duration_min: 5, status: 'done' as StepStatus, order: 3 },
      ],
      activeStepId: null,
      streak: 1,
      summary: {
        ease: 4,
        energyBefore: 3,
        energyAfter: 4,
        deltaEnergy: 1,
        distractions: 'some',
        feltEasy: true,
        note: 'Feels good to have a plan',
      },
      createdAt: weekAgo,
      completedAt: weekAgo + 15 * 60 * 1000,
    },
    {
      id: 'mock-2',
      title: 'Respond to work email',
      category: 'work',
      steps: [
        { id: 's5', text: 'Open email inbox', duration_min: 1, status: 'done' as StepStatus, order: 0 },
        { id: 's6', text: 'Read and prioritize emails', duration_min: 5, status: 'done' as StepStatus, order: 1 },
        { id: 's7', text: 'Draft responses to urgent emails', duration_min: 10, status: 'done' as StepStatus, order: 2 },
        { id: 's8', text: 'Review and send responses', duration_min: 5, status: 'done' as StepStatus, order: 3 },
      ],
      activeStepId: null,
      streak: 1,
      summary: {
        ease: 3,
        energyBefore: 2,
        energyAfter: 3,
        deltaEnergy: 1,
        distractions: 'none',
        feltEasy: false,
        note: 'Got through the inbox efficiently',
      },
      createdAt: threeDaysAgo,
      completedAt: threeDaysAgo + 25 * 60 * 1000,
    },
    {
      id: 'mock-3',
      title: 'Plan weekly meals',
      category: 'personal',
      steps: [
        { id: 's9', text: 'Check fridge and pantry', duration_min: 3, status: 'done' as StepStatus, order: 0 },
        { id: 's10', text: 'Choose 5 dinner recipes', duration_min: 10, status: 'done' as StepStatus, order: 1 },
        { id: 's11', text: 'Write grocery list', duration_min: 5, status: 'done' as StepStatus, order: 2 },
        { id: 's12', text: 'Schedule grocery shopping', duration_min: 2, status: 'done' as StepStatus, order: 3 },
      ],
      activeStepId: null,
      streak: 1,
      summary: {
        ease: 4,
        energyBefore: 3,
        energyAfter: 5,
        deltaEnergy: 2,
        distractions: 'some',
        feltEasy: true,
        note: 'Meal planning saves so much time during the week',
      },
      createdAt: threeDaysAgo,
      completedAt: threeDaysAgo + 25 * 60 * 1000,
    },
    {
      id: 'mock-4',
      title: 'Create budget tracker',
      category: 'personal',
      steps: [
        { id: 's13', text: 'List all income sources', duration_min: 5, status: 'done' as StepStatus, order: 0 },
        { id: 's14', text: 'List monthly expenses', duration_min: 10, status: 'done' as StepStatus, order: 1 },
        { id: 's15', text: 'Set up spreadsheet or app', duration_min: 15, status: 'done' as StepStatus, order: 2 },
        { id: 's16', text: 'Set spending limits by category', duration_min: 8, status: 'done' as StepStatus, order: 3 },
      ],
      activeStepId: null,
      streak: 1,
      summary: {
        ease: 3,
        energyBefore: 2,
        energyAfter: 4,
        deltaEnergy: 2,
        distractions: 'many',
        feltEasy: false,
        note: 'Feels good to have visibility into finances',
      },
      createdAt: weekAgo,
      completedAt: weekAgo + 40 * 60 * 1000,
    },
    {
      id: 'mock-5',
      title: 'Schedule doctor appointment',
      category: 'health',
      steps: [
        { id: 's17', text: 'Find insurance card', duration_min: 2, status: 'done' as StepStatus, order: 0 },
        { id: 's18', text: 'Call clinic or use online portal', duration_min: 5, status: 'done' as StepStatus, order: 1 },
        { id: 's19', text: 'Add appointment to calendar', duration_min: 2, status: 'done' as StepStatus, order: 2 },
        { id: 's20', text: 'Set reminder for day before', duration_min: 1, status: 'done' as StepStatus, order: 3 },
      ],
      activeStepId: null,
      streak: 1,
      summary: {
        ease: 5,
        energyBefore: 4,
        energyAfter: 5,
        deltaEnergy: 1,
        distractions: 'none',
        feltEasy: true,
        note: 'Quick win!',
      },
      createdAt: oneDayAgo,
      completedAt: oneDayAgo + 12 * 60 * 1000,
    },
  ];
}

export const useStore = create<AppState>((set, get) => ({
  tasks: createMockCompletedTasks(),
  activeTaskId: null,
  lastCreatedTaskId: null,
  autoStartTimer: null,
  showSurveyFor: null,
  lastEncouragement: initialEncouragement,

  createTaskFromTemplate: (templateId, overrides) => {
    const template = TASK_TEMPLATES.find((t) => t.id === templateId) ?? TASK_TEMPLATES[0];
    const { steps, activeStepId } = buildSteps(template.steps);
    const title = overrides?.title?.trim() || template.title;
    const category = overrides?.category ?? template.category;
    const newTask: Task = {
      id: createId('task'),
      title,
      category,
      steps,
      activeStepId,
      streak: 0,
      lastEncouragement: pickEncouragement(0, steps.length),
      createdAt: Date.now(),
    };
    set((state) => ({
      tasks: [...state.tasks, newTask],
      activeTaskId: newTask.id,
      lastCreatedTaskId: newTask.id,
      lastEncouragement: newTask.lastEncouragement ?? initialEncouragement,
      autoStartTimer: null,
    }));
    return newTask.id;
  },

  createTaskFromSteps: (title, category, steps) => {
    const t = title?.trim() || 'New task';
    const builtSteps = steps.map((s, index) => ({
      id: createId('step'),
      text: s.text,
      duration_min: Math.max(1, Math.round(s.duration_min ?? 2)),
      status: index === 0 ? ('doing' as StepStatus) : ('todo' as StepStatus),
      order: index,
    }));

    const newTask: Task = {
      id: createId('task'),
      title: t,
      category,
      steps: builtSteps,
      activeStepId: builtSteps[0]?.id ?? null,
      streak: 0,
      lastEncouragement: pickEncouragement(0, builtSteps.length),
      createdAt: Date.now(),
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
      activeTaskId: newTask.id,
      lastCreatedTaskId: newTask.id,
      lastEncouragement: newTask.lastEncouragement ?? initialEncouragement,
      autoStartTimer: null,
    }));

    return newTask.id;
  },

  setActiveTask: (taskId) =>
    set((state) => {
      if (!taskId) {
        return {
          activeTaskId: null,
          lastEncouragement: initialEncouragement,
        };
      }
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;
      const nextSteps = task.steps.map((step) => ({ ...step }));
      if (!nextSteps.some((step) => step.status === 'doing')) {
        const nextIndex = nextSteps.findIndex((step) => step.status !== 'done');
        if (nextIndex >= 0) {
          nextSteps[nextIndex] = { ...nextSteps[nextIndex], status: 'doing' as StepStatus };
        }
      }
      const updatedTask: Task = {
        ...task,
        steps: nextSteps.map((step, order) => ({ ...step, order })),
        activeStepId: nextSteps.find((step) => step.status === 'doing')?.id ?? null,
      };
      return {
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        activeTaskId: taskId,
        autoStartTimer: null,
        lastEncouragement: updatedTask.lastEncouragement ?? state.lastEncouragement,
      };
    }),

  markStepDone: () =>
    set((state) => {
      const { activeTaskId } = state;
      if (!activeTaskId) return state;
      const task = state.tasks.find((t) => t.id === activeTaskId);
      if (!task || !task.activeStepId) return state;

      const steps = task.steps.map((step) => ({ ...step }));
      const index = steps.findIndex((step) => step.id === task.activeStepId);
      if (index === -1) return state;
      steps[index].status = 'done' as StepStatus;

      let nextActive: string | null = null;
      for (let i = index + 1; i < steps.length; i += 1) {
        if (steps[i].status !== 'done') {
          steps[i] = { ...steps[i], status: 'doing' as StepStatus };
          nextActive = steps[i].id;
          break;
        }
      }

      const completedCount = steps.filter((step) => step.status === 'done').length;
      const allDone = completedCount === steps.length;
      const encouragement = allDone
        ? '🎉 Full sequence complete! Take a breath and celebrate the win.'
        : pickEncouragement(completedCount, steps.length);
      const streak = task.streak + 1;

      return {
        tasks: state.tasks.map((t) =>
          t.id === activeTaskId
            ? {
                ...t,
                steps: steps.map((step, order) => ({ ...step, order })),
                activeStepId: nextActive,
                streak,
                lastEncouragement: encouragement,
                completedAt: allDone ? Date.now() : t.completedAt,
              }
            : t
        ),
        showSurveyFor: allDone ? null : state.showSurveyFor,
        activeTaskId: allDone ? activeTaskId : state.activeTaskId,
        lastEncouragement: encouragement,
        autoStartTimer: null,
      };
    }),

  splitCurrentStep: (parts, options) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === state.activeTaskId);
      if (!task || !task.activeStepId) return state;
      const steps = [...task.steps];
      const index = steps.findIndex((step) => step.id === task.activeStepId);
      if (index === -1) return state;

      const [first, second] = parts ?? getSplitPair(steps[index].text);
      const created: TaskStep[] = [
        {
          id: createId('step'),
          text: first,
          duration_min: 1,
          status: 'doing' as StepStatus,
          order: 0,
        },
        {
          id: createId('step'),
          text: second,
          duration_min: 1,
          status: 'todo' as StepStatus,
          order: 0,
        },
      ];
      const merged = [
        ...steps.slice(0, index),
        ...created,
        ...steps.slice(index + 1).map((step) => ({
          ...step,
          status: step.status === 'done' ? ('done' as StepStatus) : ('todo' as StepStatus),
        })),
      ].map((step, order) => ({
        ...step,
        order,
      }));

      const encouragement = 'Split applied—micro-actions unlocked.';

      return {
        tasks: state.tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                steps: merged,
                activeStepId: created[0].id,
                lastEncouragement: encouragement,
              }
            : t
        ),
        autoStartTimer: options?.autoStartMinutes
          ? { minutes: options.autoStartMinutes, message: options.message }
          : null,
        lastEncouragement: encouragement,
      };
    }),

  insertHelperStep: (helper, options) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === state.activeTaskId);
      if (!task || !task.activeStepId) return state;
      const steps = [...task.steps];
      const index = steps.findIndex((step) => step.id === task.activeStepId);
      if (index === -1) return state;

      const helperStep: TaskStep = {
        id: createId('step'),
        text: helper.text,
        duration_min: helper.duration_min,
        status: 'doing' as StepStatus,
        order: 0,
      };
      const currentAsTodo: TaskStep = { ...steps[index], status: 'todo' as StepStatus };
      const merged = [
        ...steps.slice(0, index),
        helperStep,
        currentAsTodo,
        ...steps.slice(index + 1).map((step) => ({
          ...step,
          status: step.status === 'done' ? ('done' as StepStatus) : step.status,
        })),
      ].map((step, order) => ({ ...step, order }));

      const encouragement = 'Helper step inserted—guided search ready.';

      return {
        tasks: state.tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                steps: merged,
                activeStepId: helperStep.id,
                lastEncouragement: encouragement,
              }
            : t
        ),
        autoStartTimer: options?.autoStartMinutes
          ? { minutes: options.autoStartMinutes, message: options.message }
          : null,
        lastEncouragement: encouragement,
      };
    }),

  triggerLowEnergy: (message) =>
    set({
      autoStartTimer: { minutes: 2, message: message ?? 'Starting a steady 2-minute rescue.' },
      lastEncouragement: 'Gentle nudge en route—keep it light.',
    }),

  acknowledgeAutoStart: () => set({ autoStartTimer: null }),

  updateStepText: (taskId, stepId, text) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              steps: task.steps.map((step) => (step.id === stepId ? { ...step, text } : step)),
            }
          : task
      ),
    })),

  updateStepDuration: (taskId, stepId, minutes) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              steps: task.steps.map((step) =>
                step.id === stepId ? { ...step, duration_min: Math.max(1, Math.round(minutes)) } : step
              ),
            }
          : task
      ),
    })),

  moveStep: (taskId, stepId, direction) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;
      const steps = [...task.steps];
      const index = steps.findIndex((step) => step.id === stepId);
      if (index === -1) return state;
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= steps.length) return state;
      [steps[index], steps[swapWith]] = [steps[swapWith], steps[index]];
      const ordered = steps.map((step, order) => ({ ...step, order }));
      return {
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, steps: ordered } : t)),
      };
    }),

  addStep: (taskId, afterStepId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return null;
    const steps = [...task.steps];
    const newStep: TaskStep = {
      id: createId('step'),
      text: 'New step',
      duration_min: 1,
      status: 'todo' as StepStatus,
      order: 0,
    };

    if (afterStepId) {
      const insertIndex = steps.findIndex((step) => step.id === afterStepId);
      if (insertIndex !== -1) {
        steps.splice(insertIndex + 1, 0, newStep);
      } else {
        steps.push(newStep);
      }
    } else {
      steps.push(newStep);
    }

    const ordered = steps.map((step, order) => ({ ...step, order }));
    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, steps: ordered } : t)),
    });
    return newStep.id;
  },

  deleteStep: (taskId, stepId) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;
      const steps = task.steps.filter((step) => step.id !== stepId);
      
      if (steps.length === 0) {
        return state;
      }

      const ordered = steps.map((step, order) => ({ ...step, order }));
      const wasActiveStep = task.activeStepId === stepId;
      const newActiveStepId = wasActiveStep
        ? ordered.find((step) => step.status === 'doing')?.id ?? ordered[0]?.id ?? null
        : task.activeStepId;

      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                steps: ordered,
                activeStepId: newActiveStepId,
              }
            : t
        ),
      };
    }),

  saveSurvey: (taskId, input) =>
    set((state) => {
      const deltaEnergy = input.energyAfter - input.energyBefore;
      const summary: SessionSummary = {
        ease: input.ease,
        energyBefore: input.energyBefore,
        energyAfter: input.energyAfter,
        deltaEnergy,
        distractions: input.distractions,
        feltEasy: input.ease >= 4,
        note: input.note,
      };
      return {
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                summary,
                completedAt: task.completedAt ?? Date.now(),
                activeStepId: null,
              }
            : task
        ),
        showSurveyFor: null,
        activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId,
        lastEncouragement: 'Reflection captured—nice follow-through.',
      };
    }),

  closeSurvey: () => set({ showSurveyFor: null }),

  triggerSurvey: (taskId) => set({ showSurveyFor: taskId }),

  deleteTask: (taskId) =>
    set((state) => {
      const remaining = state.tasks.filter((task) => task.id !== taskId);
      const activeTaskId = state.activeTaskId === taskId ? null : state.activeTaskId;
      const lastCreatedTaskId = state.lastCreatedTaskId === taskId ? (remaining.at(-1)?.id ?? null) : state.lastCreatedTaskId;
      return {
        tasks: remaining,
        activeTaskId,
        lastCreatedTaskId,
        showSurveyFor: state.showSurveyFor === taskId ? null : state.showSurveyFor,
        lastEncouragement: activeTaskId
          ? state.tasks.find((t) => t.id === activeTaskId)?.lastEncouragement ?? initialEncouragement
          : initialEncouragement,
      };
    }),

  resetScenario: () =>
    set(() => {
      idCounter = 0;
      return {
        tasks: [],
        activeTaskId: null,
        lastCreatedTaskId: null,
        autoStartTimer: null,
        showSurveyFor: null,
        lastEncouragement: initialEncouragement,
      };
    }),
}));

