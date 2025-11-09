'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { calmCopy } from '@/lib/calm-copy';
import { formatTime } from '@/lib/utils';
import { Play, Pause, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FocusSessionProps {
  taskId: string;
  stepId: string;
  onComplete: () => void;
  onStuck: () => void;
}

export function FocusSession({
  taskId,
  stepId,
  onComplete,
  onStuck,
}: FocusSessionProps) {
  const step = useStore((state) =>
    state.steps.find((s) => s.id === stepId)
  );
  const session = useStore((state) => state.getCurrentSession());
  const startSession = useStore((state) => state.startSession);
  const endSession = useStore((state) => state.endSession);
  const updateSession = useStore((state) => state.updateSession);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Initialize session and timer
  useEffect(() => {
    if (!step) return;

    if (!session) {
      // Start a new session with the step's duration
      const timerMin = step.duration_min;
      const newSession = startSession(taskId, stepId, timerMin);
      setTimeLeft(timerMin * 60);
      startTimeRef.current = Date.now();
    } else {
      // Resume existing session - don't auto-start, let user choose
      const elapsed = session.started_at
        ? Math.floor((Date.now() - session.started_at) / 1000)
        : 0;
      const totalSeconds = session.timer_min * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsComplete(true);
      } else {
        // Don't auto-start, user needs to click start
        setIsRunning(false);
        setIsPaused(false);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [step, session, taskId, stepId, startSession]);

  // Handle visibility change (tab backgrounded)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        // Save current state
        if (session) {
          updateSession(session.id, {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, session, updateSession]);

  // Timer interval
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            if (session) {
              endSession(session.id, true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, session, endSession]);

  const handleStart = () => {
    if (!session) {
      const timerMin = step?.duration_min || 2;
      startSession(taskId, stepId, timerMin);
      setTimeLeft(timerMin * 60);
      startTimeRef.current = Date.now();
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
    pausedTimeRef.current = Date.now();
  };

  const handleResume = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleComplete = () => {
    if (session) {
      endSession(session.id, true);
    }
    setIsComplete(true);
    setIsRunning(false);
  };

  const handleQuickStart = (minutes: number) => {
    if (session) {
      endSession(session.id, false);
    }
    const newSession = startSession(taskId, stepId, minutes);
    setTimeLeft(minutes * 60);
    startTimeRef.current = Date.now();
    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);
  };

  if (!step) {
    return null;
  }

  if (isComplete) {
    return (
      <Card>
        <CardContent className="pt-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-semibold">
              {calmCopy.focusSession.celebrate.stepComplete}
            </h3>
            <p className="text-muted-foreground">
              {calmCopy.focusSession.celebrate.greatJob}
            </p>
            <div className="flex gap-2 justify-center mt-6">
              <Button onClick={onComplete} size="lg">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={onStuck} size="lg">
                {calmCopy.focusSession.takeBreak}
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {calmCopy.focusSession.currentStep}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">{step.text}</p>
          <p className="text-sm text-muted-foreground">
            {step.duration_min} min session
          </p>
        </div>

        {!isRunning && !session && (
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              {calmCopy.focusSession.chooseDuration}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                onClick={() => handleQuickStart(2)}
                className="h-16"
              >
                2 min
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(5)}
                className="h-16"
              >
                5 min
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(10)}
                className="h-16"
              >
                10 min
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickStart(15)}
                className="h-16"
              >
                15 min
              </Button>
            </div>
          </div>
        )}

        {(isRunning || session) && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-muted-foreground">
                {isRunning
                  ? calmCopy.focusSession.timerRunning
                  : calmCopy.focusSession.timerPaused}
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              {!isRunning && !isPaused && (
                <Button onClick={handleStart} size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
              {isRunning && (
                <Button onClick={handlePause} variant="outline" size="lg">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              {isPaused && (
                <>
                  <Button onClick={handleResume} size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={handleComplete} variant="outline" size="lg">
                    <Check className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </>
              )}
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={onStuck} size="sm">
                {calmCopy.stuck.title}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

