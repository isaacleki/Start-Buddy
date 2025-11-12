'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { StuckModal } from './StuckModal';

export function FocusSession() {
  const tasks = useStore((state) => state.tasks);
  const activeTaskId = useStore((state) => state.activeTaskId);
  const markStepDone = useStore((state) => state.markStepDone);
  const triggerLowEnergy = useStore((state) => state.triggerLowEnergy);
  const splitCurrentStep = useStore((state) => state.splitCurrentStep);
  const insertHelperStep = useStore((state) => state.insertHelperStep);
  const autoStart = useStore((state) => state.autoStartTimer);
  const acknowledgeAutoStart = useStore((state) => state.acknowledgeAutoStart);
  const lastEncouragement = useStore((state) => state.lastEncouragement);

  const activeTask = useMemo(() => tasks.find((task) => task.id === activeTaskId), [tasks, activeTaskId]);
  const steps = useMemo(() => activeTask?.steps ?? [], [activeTask]);
  const currentStep = useMemo(
    () => steps.find((step) => step.status === 'doing') ?? null,
    [steps]
  );
  const stepIndex = useMemo(
    () => (currentStep ? steps.findIndex((step) => step.id === currentStep.id) : -1),
    [steps, currentStep]
  );
  const completedCount = steps.filter((step) => step.status === 'done').length;

  const [selectedMinutes, setSelectedMinutes] = useState(() => currentStep?.duration_min ?? 2);
  const [timeLeft, setTimeLeft] = useState(selectedMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [stuckOpen, setStuckOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const suggested = currentStep?.duration_min ?? 2;
    setSelectedMinutes(suggested);
    setTimeLeft(suggested * 60);
    setIsRunning(false);
  }, [currentStep?.id, currentStep?.duration_min]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setAnnouncement('Timer finished. Mark it done or extend as needed.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (autoStart) {
      setSelectedMinutes(autoStart.minutes);
      setTimeLeft(autoStart.minutes * 60);
      setIsRunning(true);
      setAnnouncement(autoStart.message ?? `Timer started for ${autoStart.minutes} minutes.`);
      acknowledgeAutoStart();
    }
  }, [autoStart, acknowledgeAutoStart]);

  const handleDone = useCallback(() => {
    if (!currentStep) return;
    setIsRunning(false);
    markStepDone();
    setAnnouncement('Step marked complete. Nice progress.');
    setTimeLeft(selectedMinutes * 60);
  }, [currentStep, markStepDone, selectedMinutes]);

  const handleSplit = useCallback(() => {
    splitCurrentStep(undefined, { autoStartMinutes: 2, message: 'Split applied. Two-minute action on deck.' });
    setStuckOpen(false);
  }, [splitCurrentStep]);

  const handleLowEnergy = useCallback(() => {
    triggerLowEnergy('Gentle two-minute nudge queued.');
    setStuckOpen(false);
  }, [triggerLowEnergy]);

  const handleHelperStep = useCallback(() => {
    insertHelperStep(
      { text: '60s search: drawer/hamper/bathroom', duration_min: 1 },
      { autoStartMinutes: 1, message: 'Quick search ready. Take 60 seconds.' }
    );
    setStuckOpen(false);
  }, [insertHelperStep]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (stuckOpen) return;
      if (!currentStep) return;
      if (event.code === 'Space') {
        event.preventDefault();
        setIsRunning((prev) => {
          const next = !prev;
          setAnnouncement(next ? 'Timer running—focus mode engaged.' : 'Timer paused.');
          return next;
        });
      } else if (event.key === 'Enter') {
        event.preventDefault();
        handleDone();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setStuckOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentStep, stuckOpen, handleDone]);

  if (!activeTask) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Focus Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select or add a task to start the focus timer.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalSteps = steps.length;
  const currentPosition = stepIndex >= 0 ? stepIndex + 1 : totalSteps;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Focus Session</CardTitle>
        <p className="text-sm text-muted-foreground">
          {lastEncouragement || 'Micro progress unlocks macro momentum.'}
        </p>
        <p className="text-xs text-emerald-700">
          Micro-streak: {completedCount} step{completedCount === 1 ? '' : 's'} complete
        </p>
        <p className="text-xs text-muted-foreground">
          Shortcuts: <span className="font-medium">Space</span> •{' '}
          <span className="font-medium">Enter</span> • <span className="font-medium">Esc</span> •{' '}
          <span className="font-medium">E</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            Step {currentPosition} of {totalSteps}
          </p>
          <h2 className="text-xl font-semibold">{currentStep?.text ?? 'All steps complete'}</h2>
          <p className="text-sm text-muted-foreground">
            Suggested: {currentStep?.duration_min ?? 2} minute focus burst
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="timer-minutes">
            Timer minutes
          </label>
          <input
            id="timer-minutes"
            type="range"
            min={1}
            max={60}
            value={selectedMinutes}
            onChange={(event) => {
              const value = Number(event.target.value) || 1;
              setSelectedMinutes(value);
              if (!isRunning) {
                setTimeLeft(value * 60);
              }
            }}
            className="w-full accent-emerald-600"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>1 min</span>
            <span className="text-foreground font-medium">{selectedMinutes} min</span>
            <span>60 min</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-6xl font-bold tracking-wide" aria-live="polite">
            {new Date(timeLeft * 1000).toISOString().substring(14, 19)}
          </div>
          <p className="text-sm text-muted-foreground">
            {isRunning ? 'Timer running…' : 'Timer ready. Adjust minutes and press Start.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => {
              if (isRunning) {
                setIsRunning(false);
                setAnnouncement('Timer paused.');
              } else {
                setTimeLeft(selectedMinutes * 60);
                setIsRunning(true);
                setAnnouncement(`Timer started for ${selectedMinutes} minutes.`);
              }
            }}
          >
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={handleDone} variant="default">
            Done
          </Button>
          <Button onClick={() => setStuckOpen(true)} variant="outline">
            I’m Stuck
          </Button>
        </div>

        <div className="text-sm text-muted-foreground" aria-live="polite">
          {announcement}
        </div>
      </CardContent>

      <StuckModal
        open={stuckOpen}
        onOpenChange={setStuckOpen}
        onCommunity={() => {
          setStuckOpen(false);
          window.open('https://discord.gg/focus-friends', '_blank');
        }}
        onNudge={() => {
          handleLowEnergy();
          setStuckOpen(false);
        }}
        onReedit={() => {
          setStuckOpen(false);
          if (activeTaskId) {
            window.location.href = `/tasks/new?task=${activeTaskId}#steps`;
          }
        }}
      />
    </Card>
  );
}

