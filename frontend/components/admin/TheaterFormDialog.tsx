'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TheaterFormData {
  id: string;
  title: string;
  stream_url: string;
  ticket_price_usdc: number;
  description: string;
}

interface TheaterFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TheaterFormData) => Promise<void>;
  mode: 'add' | 'edit';
  initialData?: Partial<TheaterFormData>;
}

export function TheaterFormDialog({ open, onClose, onSubmit, mode, initialData }: TheaterFormDialogProps) {
  const [form, setForm] = useState<TheaterFormData>({
    id: '',
    title: '',
    stream_url: '',
    ticket_price_usdc: 0.042069,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        id: initialData?.id || '',
        title: initialData?.title || '',
        stream_url: initialData?.stream_url || '',
        ticket_price_usdc: initialData?.ticket_price_usdc ?? 0.042069,
        description: initialData?.description || '',
      });
      setError('');
    }
  }, [open, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-amber-400">
            {mode === 'add' ? 'Add Theater' : 'Edit Theater'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'add' && (
            <div>
              <label className="text-xs text-zinc-400 block mb-1">ID (slug)</label>
              <Input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="my-theater"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Theater Title"
              required
              className="bg-zinc-800 border-zinc-700 text-zinc-200"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Stream URL (YouTube)</label>
            <Input
              value={form.stream_url}
              onChange={(e) => setForm({ ...form, stream_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              required
              className="bg-zinc-800 border-zinc-700 text-zinc-200"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Price (USDC)</label>
            <Input
              type="number"
              step="0.000001"
              value={form.ticket_price_usdc}
              onChange={(e) => setForm({ ...form, ticket_price_usdc: parseFloat(e.target.value) || 0 })}
              required
              className="bg-zinc-800 border-zinc-700 text-zinc-200"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description..."
              className="bg-zinc-800 border-zinc-700 text-zinc-200"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-400">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-amber-500 text-black hover:bg-amber-400">
              {submitting ? 'Saving...' : mode === 'add' ? 'Add Theater' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
