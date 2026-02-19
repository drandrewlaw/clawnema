'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminStats } from '@/lib/types';
import { fetchAdminStats } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminStatsView } from '@/components/admin/AdminStatsView';
import { AdminTheatersView } from '@/components/admin/AdminTheatersView';
import { LogOut } from 'lucide-react';

const STORAGE_KEY = 'clawnema_admin_key';

export function AdminDashboard() {
  const [apiKey, setApiKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
      setAuthenticated(true);
    }
  }, []);

  const loadStats = useCallback(async (key: string) => {
    setStatsLoading(true);
    try {
      const data = await fetchAdminStats(key);
      setStats(data);
    } catch {
      // stats load failed silently
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load stats when authenticated
  useEffect(() => {
    if (authenticated && apiKey) {
      loadStats(apiKey);
    }
  }, [authenticated, apiKey, loadStats]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    try {
      // Test the key by fetching stats
      await fetchAdminStats(keyInput);
      localStorage.setItem(STORAGE_KEY, keyInput);
      setApiKey(keyInput);
      setAuthenticated(true);
    } catch {
      setAuthError('Invalid admin key');
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    setAuthenticated(false);
    setStats(null);
    setKeyInput('');
  }

  if (!authenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-amber-400">Admin Dashboard</h2>
            <p className="text-sm text-zinc-500 mt-1">Enter your admin API key to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Admin API Key"
              required
              className="bg-zinc-800 border-zinc-700 text-zinc-200"
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <Button type="submit" className="w-full bg-amber-500 text-black hover:bg-amber-400">
              Authenticate
            </Button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-amber-400">Admin Dashboard</h2>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-500 hover:text-zinc-300">
          <LogOut className="size-4 mr-1" />
          Logout
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats">
        <TabsList className="bg-zinc-800/50">
          <TabsTrigger value="stats" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-amber-400">
            Stats & KPIs
          </TabsTrigger>
          <TabsTrigger value="theaters" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-amber-400">
            Theaters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          {statsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-zinc-500 animate-pulse">Loading stats...</div>
            </div>
          ) : stats ? (
            <AdminStatsView stats={stats} />
          ) : (
            <div className="text-center py-16 text-zinc-500">Failed to load stats</div>
          )}
        </TabsContent>

        <TabsContent value="theaters">
          <AdminTheatersView apiKey={apiKey} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
