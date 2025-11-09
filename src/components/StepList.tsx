'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { calmCopy } from '@/lib/calm-copy';
import type { Step } from '@/lib/schemas';
import { Edit2, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react';

interface StepListProps {
  taskId: string;
  onStepsReady: () => void;
}

export function StepList({ taskId, onStepsReady }: StepListProps) {
  const allSteps = useStore((state) => state.steps);
  const updateStep = useStore((state) => state.updateStep);
  const deleteStep = useStore((state) => state.deleteStep);
  const reorderSteps = useStore((state) => state.reorderSteps);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const steps = useMemo(
    () =>
      allSteps
        .filter((step) => step.task_id === taskId)
        .sort((a, b) => a.order - b.order),
    [allSteps, taskId]
  );

  const handleEdit = (step: Step) => {
    setEditingId(step.id);
    setEditText(step.text);
  };

  const handleSaveEdit = (stepId: string) => {
    if (editText.trim()) {
      updateStep(stepId, { text: editText.trim() });
    }
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (stepId: string) => {
    deleteStep(stepId);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...steps];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderSteps(
      taskId,
      newOrder.map((step) => step.id)
    );
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newOrder = [...steps];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderSteps(
      taskId,
      newOrder.map((step) => step.id)
    );
  };

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            {calmCopy.steps.empty}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Steps</CardTitle>
        <p className="text-sm text-muted-foreground">
          {calmCopy.breakdown.editHint}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center gap-2 p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="h-6 w-6"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === steps.length - 1}
                  aria-label="Move down"
                  className="h-6 w-6"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
              {editingId === step.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(step.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveEdit(step.id)}
                    aria-label="Save"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm">{step.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.duration_min} min
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(step)}
                    aria-label="Edit step"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(step.id)}
                    aria-label="Delete step"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button onClick={onStepsReady} className="w-full">
            {calmCopy.breakdown.saveSteps}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

