'use client';

import { useState, useEffect } from 'react';
import { TaskCapture } from '@/components/TaskCapture';
import { AIBreakdown } from '@/components/AIBreakdown';
import { StepList } from '@/components/StepList';
import { FocusSession } from '@/components/FocusSession';
import { StuckModal } from '@/components/StuckModal';
import { PrivacyControls } from '@/components/PrivacyControls';
import { useStore } from '@/lib/store';
import { useTaskData } from '@/hooks/useTaskData';
import { calmCopy } from '@/lib/calm-copy';
import { getADSLevel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type ViewState = 'capture' | 'breaking-down' | 'editing-steps' | 'focus' | 'complete';

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>('capture');
  const [stuckModalOpen, setStuckModalOpen] = useState(false);
  
  // Use custom hook to get task data safely
  const {
    currentTask,
    currentStep,
    currentSession,
    steps,
    stats,
    currentTaskId,
    currentStepId,
  } = useTaskData();
  
  // Get action methods (stable references)
  const setCurrentStep = useStore((state) => state.setCurrentStep);
  const getNextStep = useStore((state) => state.getNextStep);
  const updateTask = useStore((state) => state.updateTask);

  // Auto-advance to breakdown when task is created
  useEffect(() => {
    if (currentTaskId && viewState === 'capture') {
      // Get fresh steps count from store
      const stepCount = useStore.getState().getStepsForTask(currentTaskId).length;
      if (stepCount > 0) {
        setViewState('editing-steps');
      } else {
        setViewState('breaking-down');
      }
    }
  }, [currentTaskId, viewState]);

  const handleStepsReady = () => {
    setViewState('focus');
    const firstStep = steps[0];
    if (firstStep) {
      setCurrentStep(firstStep.id);
    }
  };

  const handleStepComplete = () => {
    if (!currentTask || !currentStep) return;

    const nextStep = getNextStep(currentTask.id, currentStep.id);
    if (nextStep) {
      setCurrentStep(nextStep.id);
      setViewState('focus');
    } else {
      // All steps complete
      updateTask(currentTask.id, { status: 'completed' });
      setViewState('complete');
    }
  };

  const handleStuck = () => {
    setStuckModalOpen(true);
  };

  const handleBackToSession = () => {
    setStuckModalOpen(false);
    if (currentStep) {
      setViewState('focus');
    }
  };

  const handleNewTask = () => {
    useStore.getState().setCurrentTask(undefined);
    useStore.getState().setCurrentStep(undefined);
    setViewState('capture');
  };

  // Get ADS level for UI bias
  const adsLevel = stats ? getADSLevel(stats.ads_score) : 'low';
  const suggestTwoMin = adsLevel === 'high';

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Start Buddy</h1>
        <PrivacyControls />
      </div>

      {stats && adsLevel !== 'low' && (
        <div className="mb-4 p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2">
            <Badge variant={adsLevel === 'high' ? 'destructive' : 'secondary'}>
              {calmCopy.stats.activationDifficulty}: {adsLevel}
            </Badge>
            {suggestTwoMin && (
              <p className="text-sm text-muted-foreground">
                {calmCopy.stats.suggestion}
              </p>
            )}
          </div>
        </div>
      )}

      {viewState === 'capture' && <TaskCapture />}

      {viewState === 'breaking-down' && currentTask && (
        <AIBreakdown
          taskId={currentTask.id}
          onStepsReady={() => setViewState('editing-steps')}
        />
      )}

      {viewState === 'editing-steps' && currentTask && (
        <StepList taskId={currentTask.id} onStepsReady={handleStepsReady} />
      )}

      {viewState === 'focus' && currentTask && currentStep && (
        <FocusSession
          taskId={currentTask.id}
          stepId={currentStep.id}
          onComplete={handleStepComplete}
          onStuck={handleStuck}
        />
      )}

      {viewState === 'complete' && (
        <div className="text-center space-y-4 py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-semibold">Task Complete!</h2>
          <p className="text-muted-foreground">
            Great job completing all the steps!
          </p>
          <button
            onClick={handleNewTask}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Start New Task
          </button>
        </div>
      )}

      {currentTask && currentStep && (
        <StuckModal
          open={stuckModalOpen}
          onOpenChange={setStuckModalOpen}
          taskId={currentTask.id}
          stepId={currentStep.id}
          onBackToSession={handleBackToSession}
        />
      )}
    </main>
  );
}

