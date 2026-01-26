'use client';

import { useGameStore } from '@/game/store';

export function GraphicsPanel() {
    const isOpen = useGameStore(s => s.isGraphicsOpen);
    const toggleGraphics = useGameStore(s => s.toggleGraphics);

    const shadows = useGameStore(s => s.graphicsShadows);
    const setShadows = useGameStore(s => s.setGraphicsShadows);

    const resolution = useGameStore(s => s.graphicsResolution);
    const setResolution = useGameStore(s => s.setGraphicsResolution);

    const antialiasing = useGameStore(s => s.graphicsAntialiasing);
    const setAntialiasing = useGameStore(s => s.setGraphicsAntialiasing);

    const highQuality = useGameStore(s => s.graphicsHighQuality);
    const setHighQuality = useGameStore(s => s.setGraphicsHighQuality);

    if (!isOpen) return null;

    const checkboxStyle: React.CSSProperties = {
        width: 20,
        height: 20,
        marginRight: 10,
        cursor: 'pointer'
    };

    const labelStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 0',
        cursor: 'pointer',
        fontSize: 14
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 70,
                right: 20,
                background: 'rgba(0,0,0,0.85)',
                padding: 20,
                borderRadius: 12,
                color: 'white',
                zIndex: 1000,
                minWidth: 220,
                pointerEvents: 'auto'
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                paddingBottom: 10
            }}>
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>⚙️ 그래픽 설정</span>
                <button
                    onClick={toggleGraphics}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: 18,
                        cursor: 'pointer'
                    }}
                >✕</button>
            </div>

            <label style={labelStyle}>
                <input
                    type="checkbox"
                    checked={shadows}
                    onChange={(e) => setShadows(e.target.checked)}
                    style={checkboxStyle}
                />
                그림자
            </label>

            <label style={labelStyle}>
                <input
                    type="checkbox"
                    checked={resolution === 1.0}
                    onChange={(e) => setResolution(e.target.checked ? 1.0 : 0.75)}
                    style={checkboxStyle}
                />
                고해상도 (100%)
            </label>

            <label style={labelStyle}>
                <input
                    type="checkbox"
                    checked={antialiasing}
                    onChange={(e) => setAntialiasing(e.target.checked)}
                    style={checkboxStyle}
                />
                안티앨리어싱
            </label>

            <label style={labelStyle}>
                <input
                    type="checkbox"
                    checked={highQuality}
                    onChange={(e) => setHighQuality(e.target.checked)}
                    style={checkboxStyle}
                />
                고품질 텍스처
            </label>

            <div style={{
                marginTop: 15,
                paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,0.2)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)'
            }}>
                💡 체크 해제 시 성능 향상
            </div>
        </div>
    );
}
