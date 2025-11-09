import { z } from 'zod';

// Task Status
export const TaskStatus = z.enum(['pending', 'in_progress', 'completed', 'abandoned']);
export type TaskStatus = z.infer<typeof TaskStatus>;

// Task Schema
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  category: z.string().optional(),
  user_hard_tag: z.string().optional(),
  status: TaskStatus,
  created_at: z.number(),
  ads_score: z.number().min(0).max(100).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// Step Schema
export const StepSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  text: z.string().min(1).max(200),
  duration_min: z.union([z.literal(1), z.literal(2)]),
  status: z.enum(['pending', 'in_progress', 'completed']),
  order: z.number(),
});

export type Step = z.infer<typeof StepSchema>;

// Session Schema
export const SessionSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  step_id: z.string(),
  timer_min: z.number(),
  started_at: z.number(),
  ended_at: z.number().optional(),
  stuck_used: z.boolean().default(false),
  completed: z.boolean().default(false),
});

export type Session = z.infer<typeof SessionSchema>;

// Stats Schema (derived)
export const StatsSchema = z.object({
  task_id: z.string(),
  tts_ms: z.number().optional(), // time-to-start in milliseconds
  stuck_count: z.number().default(0),
  abandoned_count: z.number().default(0),
  carryovers: z.number().default(0),
  ads_score: z.number().min(0).max(100).default(0),
});

export type Stats = z.infer<typeof StatsSchema>;

// AI Breakdown Response Schema
export const BreakdownResponseSchema = z.object({
  steps: z.array(
    z.object({
      text: z.string(),
      duration_min: z.union([z.literal(1), z.literal(2)]),
    })
  ),
});

export type BreakdownResponse = z.infer<typeof BreakdownResponseSchema>;

// Store Schema
export const StoreSchema = z.object({
  tasks: z.array(TaskSchema),
  steps: z.array(StepSchema),
  sessions: z.array(SessionSchema),
  stats: z.array(StatsSchema),
  currentTaskId: z.string().optional(),
  currentStepId: z.string().optional(),
  currentSessionId: z.string().optional(),
});

export type Store = z.infer<typeof StoreSchema>;

