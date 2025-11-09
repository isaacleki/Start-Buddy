import { useStore } from '@/lib/store';
import { useRef, useMemo } from 'react';
import type { Step, Stats } from '@/lib/schemas';

// Stable empty array reference
const EMPTY_STEPS: Step[] = [];

/**
 * Custom hook to get task-related data without causing infinite loops
 * Uses refs to cache arrays and only update when content changes
 */
export function useTaskData() {
  // Subscribe only to primitive IDs
  const currentTaskId = useStore((state) => state.currentTaskId);
  const currentStepId = useStore((state) => state.currentStepId);
  const currentSessionId = useStore((state) => state.currentSessionId);
  
  // Subscribe to step IDs as a string - only changes when steps actually change
  const stepsSignature = useStore((state) => {
    if (!state.currentTaskId) return '';
    const taskSteps = state.steps.filter((s) => s.task_id === state.currentTaskId);
    return taskSteps.map((s) => `${s.id}-${s.order}`).sort().join(',');
  });
  
  // Subscribe to stats signature
  const statsSignature = useStore((state) => {
    if (!state.currentTaskId) return '';
    const stat = state.stats.find((s) => s.task_id === state.currentTaskId);
    return stat ? `${stat.ads_score}-${stat.stuck_count}` : '';
  });
  
  // Cache previous values
  const prevStepsRef = useRef<Step[]>([]);
  const prevStepsSigRef = useRef<string>('');
  const prevStatsRef = useRef<Stats | undefined>(undefined);
  const prevStatsSigRef = useRef<string>('');
  
  // Get store state
  const storeState = useStore.getState();
  
  // Memoize steps - only create new array if signature changed
  const steps = useMemo(() => {
    if (!currentTaskId) {
      prevStepsRef.current = EMPTY_STEPS;
      prevStepsSigRef.current = '';
      return EMPTY_STEPS;
    }
    
    // If signature hasn't changed, return cached array
    if (stepsSignature === prevStepsSigRef.current && prevStepsRef.current.length > 0) {
      return prevStepsRef.current;
    }
    
    // Signature changed, create new array
    const newSteps = storeState.steps
      .filter((s) => s.task_id === currentTaskId)
      .sort((a, b) => a.order - b.order);
    
    prevStepsRef.current = newSteps;
    prevStepsSigRef.current = stepsSignature;
    return newSteps;
  }, [currentTaskId, stepsSignature, storeState.steps]);
  
  // Memoize stats
  const stats = useMemo(() => {
    if (!currentTaskId) {
      prevStatsRef.current = undefined;
      prevStatsSigRef.current = '';
      return undefined;
    }
    
    // If signature hasn't changed, return cached stat
    if (statsSignature === prevStatsSigRef.current && prevStatsRef.current) {
      return prevStatsRef.current;
    }
    
    // Signature changed, get new stat
    const newStats = storeState.stats.find((s) => s.task_id === currentTaskId);
    prevStatsRef.current = newStats;
    prevStatsSigRef.current = statsSignature;
    return newStats;
  }, [currentTaskId, statsSignature, storeState.stats]);
  
  // Get other values using store methods
  const currentTask = currentTaskId ? storeState.getCurrentTask() : undefined;
  const currentStep = currentStepId ? storeState.getCurrentStep() : undefined;
  const currentSession = currentSessionId ? storeState.getCurrentSession() : undefined;
  
  return {
    currentTask,
    currentStep,
    currentSession,
    steps,
    stats,
    currentTaskId,
    currentStepId,
    currentSessionId,
  };
}

