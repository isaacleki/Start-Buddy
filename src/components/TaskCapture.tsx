'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { calmCopy } from '@/lib/calm-copy';
import { Plus } from 'lucide-react';

export function TaskCapture() {
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addTask = useStore((state) => state.addTask);
  const currentTaskId = useStore((state) => state.currentTaskId);
  const tasks = useStore((state) => state.tasks);

  const currentTask = useMemo(() => {
    if (!currentTaskId) return undefined;
    return tasks.find((task) => task.id === currentTaskId);
  }, [currentTaskId, tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;

    setIsAdding(true);
    try {
      addTask(title);
      setInput('');
      // Focus will be managed by the breakdown component
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (!currentTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentTask]);

  if (currentTask) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {calmCopy.taskCapture.taskOfTheMoment}
              </p>
              <h2 className="text-xl font-semibold">{currentTask.title}</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => useStore.getState().setCurrentTask(undefined)}
              aria-label="Clear current task"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder={calmCopy.taskCapture.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isAdding}
              className="flex-1"
              aria-label="Task input"
              autoFocus
            />
            <Button type="submit" disabled={isAdding || !input.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              {calmCopy.taskCapture.addButton}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

