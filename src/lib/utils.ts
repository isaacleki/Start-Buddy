import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateADS(stats: {
  tts_ms?: number;
  stuck_count: number;
  abandoned_count: number;
  carryovers: number;
}): number {
  let score = 0;

  if (stats.tts_ms) {
    const ttsMinutes = stats.tts_ms / 60000;
    if (ttsMinutes > 30) score += 40;
    else if (ttsMinutes > 15) score += 25;
    else if (ttsMinutes > 5) score += 10;
  }

  score += Math.min(stats.stuck_count * 10, 30);
  score += Math.min(stats.abandoned_count * 10, 20);
  score += Math.min(stats.carryovers * 5, 10);

  return Math.min(score, 100);
}

export function getADSLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getUniversalTemplateSteps(taskTitle: string): Array<{
  text: string;
  duration_min: 1 | 2;
}> {
  return [
    {
      text: `Break down "${taskTitle}" into smaller parts`,
      duration_min: 2,
    },
    {
      text: 'Gather necessary materials or information',
      duration_min: 2,
    },
    {
      text: 'Start with the first small piece',
      duration_min: 2,
    },
    {
      text: 'Review and adjust as needed',
      duration_min: 2,
    },
  ];
}

