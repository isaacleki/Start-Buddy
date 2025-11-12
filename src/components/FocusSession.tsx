'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { StuckModal } from './StuckModal';
import { CelebrationBanner } from './CelebrationBanner';
import { TimerSlider } from './TimerSlider';
import { CircularProgress } from './CircularProgress';
import { TaskSurveyDialog } from './TaskSurveyDialog';

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
  const showSurveyFor = useStore((state) => state.showSurveyFor);

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [isTaskComplete, setIsTaskComplete] = useState(false);
  const [timerJustStarted, setTimerJustStarted] = useState(false);
  const [delayedSurveyTaskId, setDelayedSurveyTaskId] = useState<string | null>(null);
  const prevCompletedCountRef = useRef(completedCount);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const triggerSurvey = useStore((state) => state.triggerSurvey);

  useEffect(() => {
    const suggested = currentStep?.duration_min ?? 2;
    setSelectedMinutes(suggested);
    setTimeLeft(suggested * 60);
    setIsRunning(false);
    prevCompletedCountRef.current = completedCount;
  }, [currentStep?.id, currentStep?.duration_min, completedCount]);

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
      setTimerJustStarted(true);
      setAnnouncement(autoStart.message ?? `Timer started for ${autoStart.minutes} minutes.`);
      acknowledgeAutoStart();
      setTimeout(() => setTimerJustStarted(false), 600);
    }
  }, [autoStart, acknowledgeAutoStart]);

  useEffect(() => {
    if (!showCelebration && delayedSurveyTaskId) {
      triggerSurvey(delayedSurveyTaskId);
      setDelayedSurveyTaskId(null);
    }
  }, [showCelebration, delayedSurveyTaskId, triggerSurvey]);

  const handleDone = useCallback(() => {
    if (!currentStep) return;
    setIsRunning(false);
    const wasLastStep = stepIndex === steps.length - 1;
    markStepDone();
    setTimeLeft(selectedMinutes * 60);
    
    if (wasLastStep) {
      setCelebrationMessage('🎉 Full sequence complete! Take a breath and celebrate the win.');
      setIsTaskComplete(true);
      setShowCelebration(true);
      if (activeTaskId) {
        setDelayedSurveyTaskId(activeTaskId);
      }
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }
  }, [currentStep, markStepDone, selectedMinutes, stepIndex, steps.length, activeTaskId]);

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
        <p className="text-xs text-teal-700 dark:text-teal-400">
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
          <div className="relative h-8">
            <TimerSlider
              value={selectedMinutes}
              min={1}
              max={60}
              onChange={(value) => {
                setSelectedMinutes(value);
                if (!isRunning) {
                  setTimeLeft(value * 60);
                }
              }}
              disabled={isRunning}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>1 min</span>
            <motion.span
              key={selectedMinutes}
              initial={{ scale: 1.2, color: 'rgb(20 184 166)' }}
              animate={{ scale: 1, color: 'inherit' }}
              transition={{ duration: 0.2 }}
              className="text-foreground font-medium"
            >
              {selectedMinutes} min
            </motion.span>
            <span>60 min</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="relative inline-flex items-center justify-center">
            <CircularProgress
              progress={
                isRunning && selectedMinutes > 0
                  ? Math.min(100, Math.max(0, ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100))
                  : 0
              }
              size={220}
              strokeWidth={6}
              isRunning={isRunning}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={
                timerJustStarted
                  ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : isRunning
                    ? {
                        scale: [1, 1.02, 1],
                      }
                    : {}
              }
              transition={
                timerJustStarted
                  ? {
                      type: 'tween',
                      duration: 0.6,
                      ease: 'easeOut',
                    }
                  : isRunning
                    ? {
                        type: 'tween',
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                    : {}
              }
            >
              <div className="text-6xl font-bold tracking-wide" aria-live="polite">
                {new Date(timeLeft * 1000).toISOString().substring(14, 19)}
              </div>
            </motion.div>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={isRunning ? 'running' : 'ready'}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {isRunning ? 'Timer running…' : 'Timer ready. Adjust minutes and press Start.'}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => {
                if (isRunning) {
                  setIsRunning(false);
                  setAnnouncement('Timer paused.');
              } else {
                setTimeLeft(selectedMinutes * 60);
                setIsRunning(true);
                setTimerJustStarted(true);
                setAnnouncement(`Timer started for ${selectedMinutes} minutes.`);
                setTimeout(() => setTimerJustStarted(false), 600);
              }
              }}
              className="!bg-gradient-to-b !from-teal-500 !to-teal-600 hover:!from-teal-400 hover:!to-teal-500 !text-white !shadow-lg !shadow-teal-500/30 hover:!shadow-xl hover:!shadow-teal-500/40 !border-white/20"
            >
              <span className="relative z-10">{isRunning ? 'Pause' : 'Start'}</span>
            </Button>
          </motion.div>
          <Button 
            onClick={handleDone}
            className="!bg-gradient-to-b !from-cyan-500 !to-cyan-600 hover:!from-cyan-400 hover:!to-cyan-500 !text-white !shadow-lg !shadow-cyan-500/30 hover:!shadow-xl hover:!shadow-cyan-500/40 !border-white/20"
          >
            <span className="relative z-10">Done</span>
          </Button>
          <Button 
            onClick={() => setStuckOpen(true)}
            className="!bg-gradient-to-b !from-amber-500 !to-orange-500 hover:!from-amber-400 hover:!to-orange-400 !text-white !shadow-lg !shadow-amber-500/30 hover:!shadow-xl hover:!shadow-amber-500/40 !border-white/20 font-semibold"
          >
            <span className="relative z-10">I&apos;m Stuck</span>
          </Button>
        </div>

        <div className="text-sm text-muted-foreground" aria-live="polite">
          {announcement}
        </div>
      </CardContent>

      <CelebrationBanner 
        show={showCelebration} 
        message={celebrationMessage}
        isComplete={isTaskComplete}
      />
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
      <TaskSurveyDialog showCelebration={showCelebration} />
    </Card>
  );
}

