'use client';

import { GameScene } from '@/components/game/GameScene';
import { InventoryUI } from '@/components/ui/InventoryUI';
import { ToastContainer } from '@/components/ui/Toast';
import { UIOverlay } from '@/components/game/UIOverlay'; // Keep existing import
import { EndingVideo } from '@/components/ui/EndingVideo';
import { StartMenu } from '@/components/ui/StartMenu';
import { CreateModeUI } from '@/components/ui/CreateModeUI';

import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useGameStore } from '@/game/store';

export default function Home() {
  const gameStarted = useGameStore(s => s.gameStarted);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Start Menu */}
      {!gameStarted && <StartMenu />}

      {/* Create Mode UI */}
      <CreateModeUI />

      {/* Game Content */}
      {gameStarted && (
        <>
          <LoadingScreen />

          {/* 3D Scene */}
          <GameScene />

          {/* UI Overlays */}
          <UIOverlay />
          <ToastContainer />

          {/* Ending Video */}
          <EndingVideo />
        </>
      )}
    </main>
  );
}
