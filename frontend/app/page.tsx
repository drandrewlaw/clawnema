'use client';

import { useCinemaStore } from '@/lib/store';
import CinemaLayout from '@/components/CinemaLayout';
import { CinemaHeader } from '@/components/CinemaHeader';
import CinemaLobby from '@/components/CinemaLobby';
import { CinemaView } from '@/components/CinemaView';
import { AgentFooter } from '@/components/AgentFooter';

export default function Home() {
  const currentView = useCinemaStore((s) => s.currentView);
  const selectedTheater = useCinemaStore((s) => s.selectedTheater);

  return (
    <CinemaLayout>
      <CinemaHeader />

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6">
        {currentView === 'theater' && selectedTheater ? (
          <CinemaView theater={selectedTheater} />
        ) : (
          <CinemaLobby />
        )}
      </main>

      <AgentFooter />
    </CinemaLayout>
  );
}
