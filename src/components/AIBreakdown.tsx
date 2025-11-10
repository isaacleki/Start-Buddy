'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { calmCopy } from '@/lib/calm-copy';
import { getUniversalTemplateSteps } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { BreakdownResponseSchema } from '@/lib/schemas';

interface AIBreakdownProps {
  taskId: string;
  onStepsReady: () => void;
}

export function AIBreakdown({ taskId, onStepsReady }: AIBreakdownProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const hasRequestedRef = useRef(false);
  const task = useStore((state) => state.tasks.find((t) => t.id === taskId));
  const allSteps = useStore((state) => state.steps);
  const setSteps = useStore((state) => state.setSteps);
  const recordTimeToStart = useStore((state) => state.recordTimeToStart);
  const taskStartTime = useStore((state) => {
    const t = state.tasks.find((t) => t.id === taskId);
    return t?.created_at;
  });

  const steps = useMemo(
    () =>
      allSteps
        .filter((step) => step.task_id === taskId)
        .sort((a, b) => a.order - b.order),
    [allSteps, taskId]
  );

  // Auto-advance to editing steps when steps are ready
  useEffect(() => {
    if (!loading && steps.length > 0) {
      // Small delay to show the message
      const timer = setTimeout(() => {
        onStepsReady();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, steps.length, onStepsReady]);

  useEffect(() => {
    hasRequestedRef.current = false;
  }, [taskId, task?.title]);

  useEffect(() => {
    const generateSteps = async () => {
      if (!task) return;

      if (steps.length > 0) {
        setLoading(false);
        return;
      }

      if (hasRequestedRef.current) return;
      hasRequestedRef.current = true;

      setLoading(true);
      setError(null);
      setFallback(false);
      const startTime = Date.now();

      try {
        // Record time to start
        if (taskStartTime) {
          const ttsMs = startTime - taskStartTime;
          recordTimeToStart(taskId, ttsMs);
        }

        // Call API
        const response = await fetch('/api/breakdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskTitle: task.title }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate steps');
        }

        const data = await response.json();
        setFallback(data.fallback || false);

        // Validate response
        const validated = BreakdownResponseSchema.parse(data);

        // Set steps in store
        setSteps(taskId, validated.steps);
      } catch (err) {
        console.error('Error generating steps:', err);
        setError(calmCopy.errors.breakdownError);
        setFallback(true);
        // Use fallback template
        const fallbackSteps = getUniversalTemplateSteps(task.title);
        setSteps(taskId, fallbackSteps);
      } finally {
        setLoading(false);
      }
    };

    generateSteps();
  }, [taskId, task, steps.length, setSteps, recordTimeToStart, taskStartTime]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {calmCopy.breakdown.generating}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          {fallback && (
            <p className="text-sm text-muted-foreground mt-2">
              {calmCopy.breakdown.fallback}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-4">
          {fallback
            ? calmCopy.breakdown.fallback
            : calmCopy.breakdown.stepsReady}
        </p>
        {steps.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Preparing your steps...
          </p>
        )}
      </CardContent>
    </Card>
  );
}

