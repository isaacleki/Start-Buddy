'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';

const scaleOptions = [1, 2, 3, 4, 5];
const clampScore = (value: number) => Math.min(5, Math.max(1, Math.round(value)));

export function TaskSurveyDialog() {
  const showSurveyFor = useStore((state) => state.showSurveyFor);
  const saveSurvey = useStore((state) => state.saveSurvey);
  const closeSurvey = useStore((state) => state.closeSurvey);

  const [ease, setEase] = useState(3);
  const [energyBefore, setEnergyBefore] = useState(3);
  const [energyAfter, setEnergyAfter] = useState(3);
  const [distractions, setDistractions] = useState<'none' | 'some' | 'many'>('none');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (showSurveyFor) {
      setEase(3);
      setEnergyBefore(3);
      setEnergyAfter(3);
      setDistractions('none');
      setNote('');
    }
  }, [showSurveyFor]);

  const handleSubmit = () => {
    if (!showSurveyFor) return;
    saveSurvey(showSurveyFor, {
      ease,
      energyBefore,
      energyAfter,
      distractions,
      note: note || undefined,
    });
  };

  return (
    <Dialog open={Boolean(showSurveyFor)} onOpenChange={(open) => !open && closeSurvey()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick reflection</DialogTitle>
          <DialogDescription>
            Takes ~20 seconds. Helps keep momentum and capture how the session felt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">How easy did it feel?</label>
            <div className="mt-1 flex gap-2">
              {scaleOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={ease === option ? 'default' : 'outline'}
                  onClick={() => setEase(option)}
                  className="h-10 w-10"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Energy before</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={energyBefore}
                onChange={(event) => setEnergyBefore(clampScore(Number(event.target.value)))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Energy after</label>
              <Input
                type="number"
                min={1}
                max={5}
                value={energyAfter}
                onChange={(event) => setEnergyAfter(clampScore(Number(event.target.value)))}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Distractions?</label>
            <div className="mt-1 flex gap-2">
              {(['none', 'some', 'many'] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={distractions === option ? 'default' : 'outline'}
                  onClick={() => setDistractions(option)}
                  className="capitalize"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeSurvey}>
              Skip
            </Button>
            <Button onClick={handleSubmit}>Save reflection</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
