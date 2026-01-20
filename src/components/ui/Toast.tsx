'use client';

import { useGameStore } from '@/game/store';
import { useEffect, useState } from 'react';

export function ToastContainer() {
    const toasts = useGameStore(s => s.toasts);

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none',
            zIndex: 9999,
        }}>
            {toasts.map((toast) => (
                <Toast key={toast.id} message={toast.message} />
            ))}
        </div>
    );
}

function Toast({ message }: { message: string }) {
    return (
        <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'toast-in 0.3s ease-out forwards',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        }}>
            <style jsx>{`
                @keyframes toast-in {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
            {message}
        </div>
    );
}
