'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StuckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommunity: () => void;
  onNudge: () => void;
  onReedit: () => void;
}

export function StuckModal({ open, onOpenChange, onCommunity, onNudge, onReedit }: StuckModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>I’m stuck</DialogTitle>
          <DialogDescription>
            Pick a quick assist to keep momentum gentle and supportive.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Button onClick={onCommunity} className="w-full justify-start !text-foreground" variant="outline">
            <div className="flex flex-col items-start relative z-10">
              <span className="font-semibold text-foreground">Chat with community</span>
              <span className="text-sm text-muted-foreground">Connect with others for support and ideas</span>
            </div>
          </Button>
          <Button onClick={onNudge} className="w-full justify-start !text-foreground" variant="outline">
            <div className="flex flex-col items-start relative z-10">
              <span className="font-semibold text-foreground">Add a 1 min nudge</span>
              <span className="text-sm text-muted-foreground">Queue a tiny rescue timer to ease back in</span>
            </div>
          </Button>
          <Button onClick={onReedit} className="w-full justify-start !text-foreground" variant="outline">
            <div className="flex flex-col items-start relative z-10">
              <span className="font-semibold text-foreground">Re-edit task</span>
              <span className="text-sm text-muted-foreground">Jump to the breakdown editor to tweak steps</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

