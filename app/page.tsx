'use client';

import { GameScene } from '@/components/game/GameScene';
import { UIOverlay } from '@/components/game/UIOverlay';

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden relative selection:bg-none">
      <GameScene />
      <UIOverlay />
    </main>
  );
}
