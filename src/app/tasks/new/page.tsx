'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepList } from '@/components/StepList';
import { useStore, Category } from '@/lib/store';

const categories: Category[] = ['work', 'personal', 'hobby', 'health'];
const DEFAULT_TITLE = 'Get ready for work';
const DEFAULT_CATEGORY: Category = 'personal';

function AddTaskScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createTask = useStore((state) => state.createTaskFromTemplate);
  const deleteTask = useStore((state) => state.deleteTask);
  const setActiveTask = useStore((state) => state.setActiveTask);
  const tasks = useStore((state) => state.tasks);
  const activeTaskId = useStore((state) => state.activeTaskId);
  const lastCreatedTaskId = useStore((state) => state.lastCreatedTaskId);

  const taskParam = searchParams.get('task');

  const activeTask = useMemo(() => tasks.find((task) => task.id === activeTaskId), [tasks, activeTaskId]);

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [category, setCategory] = useState<Category>(DEFAULT_CATEGORY);

  useEffect(() => {
    if (taskParam) {
      setActiveTask(taskParam);
    }
  }, [taskParam, setActiveTask]);

  useEffect(() => {
    if (activeTask) {
      setTitle(activeTask.title);
      setCategory(activeTask.category);
    }
  }, [activeTask, activeTaskId]);

  const handleGenerate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = createTask('morning-prep', { title, category });
    setActiveTask(id);
  };

  const handleStartOver = () => {
    if (activeTaskId) {
      deleteTask(activeTaskId);
    }
    setActiveTask(null);
    setTitle(DEFAULT_TITLE);
    setCategory(DEFAULT_CATEGORY);
    router.replace('/tasks/new');
  };

  const handleLaunchFocus = () => {
    router.push('/focus');
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Add task</CardTitle>
          <p className="text-sm text-muted-foreground">
            Name the mission and choose a category. Generate or tweak the micro-steps, then jump straight into focus mode.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleGenerate}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Task title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm capitalize"
              >
                {categories.map((option) => (
                  <option key={option} value={option} className="capitalize">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={handleStartOver}>
                Start over
              </Button>
              <Button type="submit">Generate breakdown</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section id="steps" className="space-y-4">
        <StepList editable />
        <div className="flex justify-end">
          <Button onClick={handleLaunchFocus} className="px-6" disabled={!activeTask}>
            Start focus session
          </Button>
        </div>
      </section>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={null}>
      <AddTaskScreen />
    </Suspense>
  );
}
