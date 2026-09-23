'use client';

import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * A delete control that asks first and reports what actually happened.
 *
 * Deleting money records moves the Main Account — removing a client advance
 * takes that money back out, removing a subcontractor payment puts it back —
 * so `warning` is used to say so before the click, and the server's own
 * message is shown afterwards, because some deletes deactivate instead
 * (a worker with attendance keeps their wage history).
 */
export function ConfirmDelete({
  label,
  description,
  warning,
  onConfirm,
  disabled,
  variant = 'icon',
  className,
}: {
  /** What is being deleted, e.g. 'Client Progress Payment'. */
  label: string;
  description?: string;
  warning?: string;
  onConfirm: () => Promise<unknown>;
  disabled?: boolean;
  variant?: 'icon' | 'button';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Could not delete this');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          aria-label={`Delete ${label}`}
          title={`Delete ${label}`}
          disabled={disabled}
          onClick={() => { setError(null); setOpen(true); }}
          className={cn(
            'p-1.5 rounded-lg text-muted-foreground/60 hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40',
            className,
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => { setError(null); setOpen(true); }}
          className={cn('rounded-xl h-9 text-xs font-bold text-danger border-danger/30 hover:bg-danger/10', className)}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Delete
        </Button>
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Delete {label}?</DialogTitle>
            <DialogDescription>
              {description ?? 'This cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {warning && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-warning-subtle/20 border border-warning/25">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden />
              <p className="text-[12px] font-medium text-foreground/80">{warning}</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl h-9 text-xs font-bold bg-danger text-danger-foreground hover:bg-danger/90"
              disabled={busy}
              onClick={run}
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
