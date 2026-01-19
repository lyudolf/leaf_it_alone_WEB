# Obstacle Objects MVP (v0.2) - Therapeutic Research Tool

An interactive research tool for observing and regulating procedural obstacle objects. The current version features the **FOG** object.

## Run Steps
1. Install dependencies: `npm install xstate @xstate/react`
2. Start dev server: `npm run dev`
3. Open `http://localhost:3000`

## Interactions
- **Arousal**: Fog intensity increases naturally over time (capped at 0.7).
- **HOLD**: Press and hold on the screen for **1200ms**. A regulatory ring will appear.
- **RELEASE**: Upon 1200ms completion, fog intensity drops sharply (35% of current), visuals calm, and a blue hue is briefly visible.
- **DRAG**: Click/touch and move to guide the fog's flow (wind vector).
- **PANIC**: Immediate neutralization of all stimuli.

## Tuning Table (FOG)

| Parameter | Default Value | Effect |
|-----------|---------------|--------|
| `holdMs` | 1200ms | Duration required for a successful RELEASE. |
| `arousalRate`| 0.05 / sec | Speed at which intensity increases naturally. |
| `maxStimulus`| 0.7 | Absolute hard cap for all intensity levels. |
| `releaseDrop`| 0.35 (x) | Multiplying factor applied to intensity upon success. |
| `windStrength`| 2.5 | Influence of drag gestures on fog drift. |
| `wobbleMax` | 1.5 | Max vibration of fog blobs at peak intensity. |

## Acceptance Checklist

- [ ] **Intensity Escalation**: Fog density increases slowly but never crosses 70% threshold.
- [ ] **Hold/Release Reliability**: Holding for ~1.2s consistently triggers the release effect and intensity drop.
- [ ] **Wind Control**: Dragging moves the fog blobs in the matching direction.
- [ ] **Panic Button**: Immediate return to neutral/safe state (hidden/low intensity).
- [ ] **Neutral Mode**: Visuals appear "softer" and more abstract when toggled ON.
- [ ] **Safety Compliance**: No raw trauma text or narrative inputs are present.

## Architecture Detail
- **State Machine**: Driven by XState (`src/machines/fogMachine.ts`).
- **Visuals**: Procedural InstancedMesh in Three.js (`src/components/objects/FogCloud.tsx`).
- **Logic**: Decoupled using a `SceneSpec` configuration.
