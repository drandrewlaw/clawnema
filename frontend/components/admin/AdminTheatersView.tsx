'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminTheater } from '@/lib/types';
import { fetchAdminTheaters, createAdminTheater, updateAdminTheater, deleteAdminTheater } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { TheaterFormDialog } from './TheaterFormDialog';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface AdminTheatersViewProps {
  apiKey: string;
}

export function AdminTheatersView({ apiKey }: AdminTheatersViewProps) {
  const [theaters, setTheaters] = useState<AdminTheater[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTheater, setEditTheater] = useState<AdminTheater | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTheater | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTheaters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminTheaters(apiKey);
      setTheaters(data);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    loadTheaters();
  }, [loadTheaters]);

  async function handleAdd(data: { id: string; title: string; stream_url: string; ticket_price_usdc: number; description: string }) {
    await createAdminTheater(apiKey, data);
    await loadTheaters();
  }

  async function handleEdit(data: { id: string; title: string; stream_url: string; ticket_price_usdc: number; description: string }) {
    if (!editTheater) return;
    const { title, stream_url, ticket_price_usdc, description } = data;
    await updateAdminTheater(apiKey, editTheater.id, { title, stream_url, ticket_price_usdc, description });
    setEditTheater(null);
    await loadTheaters();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminTheater(apiKey, deleteTarget.id);
      setDeleteTarget(null);
      await loadTheaters();
    } catch {
      // error handled silently
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-zinc-400">
          {theaters.length} theater{theaters.length !== 1 ? 's' : ''}
        </h3>
        <Button onClick={() => setAddOpen(true)} size="sm" className="bg-amber-500 text-black hover:bg-amber-400">
          <Plus className="size-4 mr-1" />
          Add Theater
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading theaters...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">ID</TableHead>
                  <TableHead className="text-zinc-400">Title</TableHead>
                  <TableHead className="text-zinc-400 text-right">Price</TableHead>
                  <TableHead className="text-zinc-400 hidden md:table-cell">Stream URL</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {theaters.map(t => (
                  <TableRow key={t.id} className="border-zinc-800">
                    <TableCell className="text-zinc-300 font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="text-zinc-200">{t.title}</TableCell>
                    <TableCell className="text-zinc-300 text-right">${t.ticket_price_usdc}</TableCell>
                    <TableCell className="text-zinc-500 text-xs hidden md:table-cell max-w-[200px] truncate">
                      {t.stream_url}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditTheater(t)}
                          className="text-zinc-400 hover:text-amber-400"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(t)}
                          className="text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <TheaterFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        mode="add"
      />

      {/* Edit Dialog */}
      <TheaterFormDialog
        open={editTheater !== null}
        onClose={() => setEditTheater(null)}
        onSubmit={handleEdit}
        mode="edit"
        initialData={editTheater || undefined}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Theater</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete <strong className="text-zinc-200">{deleteTarget?.title}</strong>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="text-zinc-400">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
