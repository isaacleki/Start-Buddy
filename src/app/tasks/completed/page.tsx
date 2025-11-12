'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore, Category } from '@/lib/store';

const filterOptions: Array<'all' | Category> = ['all', 'work', 'personal', 'hobby', 'health'];

export default function CompletedTasksPage() {
  const tasks = useStore((state) => state.tasks);
  const [filter, setFilter] = useState<'all' | Category>('all');

  const completedTasks = useMemo(
    () =>
      tasks.filter((task) => task.summary && (filter === 'all' || task.category === filter)),
    [tasks, filter]
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Completed sessions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ratings and reflections captured after each focus run. Filter by category to explore patterns.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={filter === option ? 'default' : 'ghost'}
              onClick={() => setFilter(option)}
              className="capitalize"
            >
              {option === 'all' ? 'All' : option}
            </Button>
          ))}
        </CardContent>
      </Card>

      {completedTasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No completed sessions yet. Run a task from the{' '}
            <Link href="/" className="text-teal-600 dark:text-teal-400">
              active task view
            </Link>{' '}
            and log a reflection when you finish.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {completedTasks.map((task) => (
            <Card key={task.id} className="border-muted">
              <CardHeader>
                <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {task.category}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Ease rating: <span className="font-medium">{task.summary?.ease}/5</span>
                </p>
                <p>
                  Energy shift: <span className="font-medium">{task.summary?.deltaEnergy}</span>
                </p>
                <p>Distractions: {task.summary?.distractions}</p>
                {task.summary?.note && (
                  <p className="rounded-md bg-muted px-3 py-2 text-xs">Note: {task.summary.note}</p>
                )}
                <div className="pt-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/tasks/new?task=${task.id}#steps`}>Review steps</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
