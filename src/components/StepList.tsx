'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore, StepStatus } from '@/lib/store';

const statusCopy: Record<StepStatus, { label: string; className: string; dot: string }> = {
  todo: { label: 'Queued', className: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
  doing: { label: 'In progress', className: 'text-emerald-600 font-medium', dot: 'bg-emerald-500' },
  done: { label: 'Completed', className: 'text-emerald-500', dot: 'bg-emerald-500' },
};

interface StepListProps {
  editable?: boolean;
}

export function StepList({ editable = false }: StepListProps) {
  const tasks = useStore((state) => state.tasks);
  const activeTaskId = useStore((state) => state.activeTaskId);
  const lastEncouragement = useStore((state) => state.lastEncouragement);
  const updateStepText = useStore((state) => state.updateStepText);
  const updateStepDuration = useStore((state) => state.updateStepDuration);
  const moveStep = useStore((state) => state.moveStep);

  const activeTask = useMemo(() => tasks.find((task) => task.id === activeTaskId), [tasks, activeTaskId]);
  const steps = activeTask?.steps ?? [];
  const completed = steps.filter((step) => step.status === 'done').length;

  if (!activeTask) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Steps</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select or create a task to see its breakdown.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{editable ? 'AI-generated breakdown' : 'Steps'}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {editable
            ? 'Tweak copy, durations, or order before you lock in the session.'
            : lastEncouragement || 'Micro-steps keep it light. Adjust anytime.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground">No steps available yet.</p>
        )}
        {steps.map((step, index) => {
          const status = statusCopy[step.status];
          const canMoveUp = index > 0;
          const canMoveDown = index < steps.length - 1;

          return (
            <div
              key={step.id}
              className="space-y-2 rounded-md border bg-card px-4 py-3"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>
                  Step {index + 1}
                  {step.status === 'doing' && <span className="ml-2 text-emerald-600">Current focus</span>}
                </span>
                {editable && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveStep(activeTask!.id, step.id, 'up')}
                      disabled={!canMoveUp}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveStep(activeTask!.id, step.id, 'down')}
                      disabled={!canMoveDown}
                    >
                      ↓
                    </Button>
                  </div>
                )}
              </div>

              {editable ? (
                <textarea
                  value={step.text}
                  onChange={(event) => updateStepText(activeTask!.id, step.id, event.target.value)}
                  className="min-h-[68px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              ) : (
                <p className="text-sm font-medium">{step.text}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`inline-flex h-2 w-2 rounded-full ${status.dot}`} />
                {editable ? (
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    className="h-8 w-20"
                    value={step.duration_min}
                    onChange={(event) =>
                      updateStepDuration(activeTask!.id, step.id, Number(event.target.value) || 1)
                    }
                  />
                ) : (
                  <span>{step.duration_min} min</span>
                )}
                <span className={status.className}>{status.label}</span>
              </div>
            </div>
          );
        })}
        {steps.length > 0 && !editable && (
          <p className="text-xs text-muted-foreground">
            Progress: {completed}/{steps.length} steps complete.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

