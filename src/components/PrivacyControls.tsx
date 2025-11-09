'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { calmCopy } from '@/lib/calm-copy';
import { Download, Trash2 } from 'lucide-react';

export function PrivacyControls() {
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const exportData = useStore((state) => state.exportData);
  const deleteAllData = useStore((state) => state.deleteAllData);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `start-buddy-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const handleDelete = () => {
    deleteAllData();
    setDeleteOpen(false);
    // Reload page to reset state
    window.location.reload();
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExportOpen(true)}
        aria-label="Export data"
      >
        <Download className="h-4 w-4 mr-2" />
        {calmCopy.privacy.exportData}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDeleteOpen(true)}
        aria-label="Delete all data"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {calmCopy.privacy.deleteAll}
      </Button>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{calmCopy.privacy.exportData}</DialogTitle>
            <DialogDescription>
              Export all your tasks, steps, and sessions as JSON.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{calmCopy.privacy.deleteAll}</DialogTitle>
            <DialogDescription>
              {calmCopy.privacy.deleteConfirm}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

