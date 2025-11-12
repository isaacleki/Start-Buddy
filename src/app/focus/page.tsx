'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepList } from '@/components/StepList';
import { FocusSession } from '@/components/FocusSession';
import { useStore } from '@/lib/store';

export default function FocusPage() {
  const activeTaskId = useStore((state) => state.activeTaskId);
  const tasks = useStore((state) => state.tasks);
  const activeTask = tasks.find((task) => task.id === activeTaskId);

  if (!activeTask) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No active task selected</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Choose a task to focus on. You can add a new task or revisit a breakdown.</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/tasks/new">Add task</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/tasks/completed">View history</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <FocusSession />
      <StepList />
    </div>
  );
}
