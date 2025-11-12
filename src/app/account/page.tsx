'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const tasks = useStore((state) => state.tasks);
  const deleteTask = useStore((state) => state.deleteTask);
  const completedTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.completedAt)
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  }, [tasks]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Session history
          </div>
          <CardTitle className="text-xl">Account overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review reflections from completed sessions. Delete any you no longer need or rerun them from the breakdown.
          </p>
        </CardHeader>
      </Card>

      {completedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No completed sessions yet. Start with the <Link href="/tasks/new" className="text-emerald-600">add task</Link> flow and lock in
            a micro-step streak.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {completedTasks.map((task) => (
            <Card key={task.id} className="border-muted">
              <CardHeader className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{task.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tasks/new?task=${task.id}#steps`}>View breakdown</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-500"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                {task.summary ? (
                  <>
                    <p>
                      Ease rating: <span className="font-medium text-foreground">{task.summary.ease}/5</span>
                    </p>
                    <p>
                      Energy change: <span className="font-medium text-foreground">{task.summary.deltaEnergy}</span>
                    </p>
                    <p>Energy before: {task.summary.energyBefore}</p>
                    <p>Energy after: {task.summary.energyAfter}</p>
                    <p>Distractions: {task.summary.distractions}</p>
                    {task.summary.note && (
                      <p className="md:col-span-2 rounded-md bg-muted px-3 py-2 text-xs">Note: {task.summary.note}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="md:col-span-2 text-muted-foreground">
                      Reflection skipped. You can still rerun or delete this session below.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
