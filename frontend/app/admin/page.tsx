'use client';

import CinemaLayout from '@/components/CinemaLayout';
import { CinemaHeader } from '@/components/CinemaHeader';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AgentFooter } from '@/components/AgentFooter';

export default function AdminPage() {
  return (
    <CinemaLayout>
      <CinemaHeader />
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6">
        <AdminDashboard />
      </main>
      <AgentFooter />
    </CinemaLayout>
  );
}
