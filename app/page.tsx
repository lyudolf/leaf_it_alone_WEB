'use client';

import { GameScene } from '@/components/game/GameScene';
import { InventoryUI } from '@/components/ui/InventoryUI';
import { ToastContainer } from '@/components/ui/Toast';
import { UIOverlay } from '@/components/game/UIOverlay'; // Keep existing import

import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <LoadingScreen />

      {/* 3D Scene */}
      <GameScene />

      {/* UI Overlays */}
      <UIOverlay />
      <ToastContainer />
    </main>
  );
}
