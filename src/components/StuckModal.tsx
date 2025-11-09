'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { calmCopy } from '@/lib/calm-copy';
import { getUniversalTemplateSteps } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface StuckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  stepId: string;
  onBackToSession: () => void;
}

export function StuckModal({
  open,
  onOpenChange,
  taskId,
  stepId,
  onBackToSession,
}: StuckModalProps) {
  const [loading, setLoading] = useState(false);
  const step = useStore((state) => state.steps.find((s) => s.id === stepId));
  const task = useStore((state) => state.tasks.find((t) => t.id === taskId));
  const addStep = useStore((state) => state.addStep);
  const setSteps = useStore((state) => state.setSteps);
  const incrementStuckCount = useStore((state) => state.incrementStuckCount);
  const getStepsForTask = useStore((state) => state.getStepsForTask);

  const handleTooBig = async () => {
    setLoading(true);
    incrementStuckCount(taskId);

    try {
      // Split the current step into smaller micro-steps
      const microSteps = [
        {
          text: `Break down: ${step?.text || 'this step'}`,
          duration_min: 2 as const,
        },
        {
          text: 'Start with the first tiny piece',
          duration_min: 2 as const,
        },
        {
          text: 'Continue with the next piece',
          duration_min: 2 as const,
        },
      ];

      // Add new micro-steps
      const existingSteps = getStepsForTask(taskId);
      const currentStepIndex = existingSteps.findIndex((s) => s.id === stepId);
      const newSteps = microSteps.map((microStep, index) =>
        addStep(taskId, microStep.text, microStep.duration_min, currentStepIndex + index + 1)
      );

      // Set the first new step as current
      if (newSteps[0]) {
        useStore.getState().setCurrentStep(newSteps[0].id);
      }

      onOpenChange(false);
      onBackToSession();
    } catch (error) {
      console.error('Error splitting step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLowEnergy = async () => {
    setLoading(true);
    incrementStuckCount(taskId);

    try {
      // Create a 2-minute rescue step at the beginning
      const rescueStep = addStep(
        taskId,
        `2-minute rescue: ${step?.text || 'quick start'}`,
        2,
        0
      );

      // Set the rescue step as current
      useStore.getState().setCurrentStep(rescueStep.id);

      onOpenChange(false);
      onBackToSession();
    } catch (error) {
      console.error('Error creating rescue step:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{calmCopy.stuck.title}</DialogTitle>
          <DialogDescription>
            What&apos;s getting in the way?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            onClick={handleTooBig}
            disabled={loading}
            className="w-full h-20 text-left justify-start"
            variant="outline"
          >
            <div className="flex flex-col items-start">
              <span className="font-semibold">{calmCopy.stuck.tooBig}</span>
              <span className="text-sm text-muted-foreground">
                Break this into smaller steps
              </span>
            </div>
            {loading && <Loader2 className="h-4 w-4 ml-auto animate-spin" />}
          </Button>
          <Button
            onClick={handleLowEnergy}
            disabled={loading}
            className="w-full h-20 text-left justify-start"
            variant="outline"
          >
            <div className="flex flex-col items-start">
              <span className="font-semibold">{calmCopy.stuck.lowEnergy}</span>
              <span className="text-sm text-muted-foreground">
                Start with a 2-minute rescue step
              </span>
            </div>
            {loading && <Loader2 className="h-4 w-4 ml-auto animate-spin" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

