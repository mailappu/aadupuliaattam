// Pure animation planner.
//
// The game engine computes the next state instantly. This module derives the
// *visual* description of how to replay that move on the board — node IDs to
// pulse, the edge to glide along, the goat being captured, and timing.
//
// CRITICAL: This module never imports React, never touches engine state, and
// never mutates anything. It just describes what the rendering layer should
// show.

import type { Move } from "@/game/engine";
import type { NodeId } from "@/game/board";

export interface AnimationStep {
  /** Stable id for React keys / dedupe. */
  id: number;
  /** Origin node — pulsed with the "depart" colour. */
  origin: NodeId | null;
  /** Destination node — pulsed with the "land" colour. */
  destination: NodeId;
  /** If a capture, the goat being removed. */
  capturedAt: NodeId | null;
  /** Whether the moving piece should arc (captures get a stronger arc). */
  arc: "none" | "soft" | "lunge";
  /** Total duration of the visual step in ms. */
  durationMs: number;
}

const STEP_DURATION = {
  place: 260,
  move: 340,
  capture: 480,
} as const;

let _seq = 0;
export function nextAnimationId(): number {
  _seq = (_seq + 1) % Number.MAX_SAFE_INTEGER;
  return _seq;
}

/**
 * Plan the visual representation of a single move. Pure: same input, same
 * output (modulo the monotonic id).
 */
export function planAnimation(move: Move): AnimationStep {
  if (move.kind === "place") {
    return {
      id: nextAnimationId(),
      origin: null,
      destination: move.to,
      capturedAt: null,
      arc: "none",
      durationMs: STEP_DURATION.place,
    };
  }
  if (move.kind === "move") {
    return {
      id: nextAnimationId(),
      origin: move.from,
      destination: move.to,
      capturedAt: null,
      arc: "soft",
      durationMs: STEP_DURATION.move,
    };
  }
  // capture
  return {
    id: nextAnimationId(),
    origin: move.from,
    destination: move.to,
    capturedAt: move.over,
    arc: "lunge",
    durationMs: STEP_DURATION.capture,
  };
}
