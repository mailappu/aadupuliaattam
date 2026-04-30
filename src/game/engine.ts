// Pure game engine for Aadu Puli Attam.
// No React, no DOM. Deterministic. All state transitions return new state.

import {
  ADJACENCY,
  JUMPS,
  STARTING_TIGERS,
  TOTAL_GOATS_TO_PLACE,
  TOTAL_NODES,
  type NodeId,
} from "./board";

export type Cell = "empty" | "tiger" | "goat";
export type Player = "tiger" | "goat";
export type Phase = "placement" | "movement" | "ended";
export type Winner = "tiger" | "goat" | null;

export interface GameState {
  cells: Cell[];                 // length TOTAL_NODES
  turn: Player;
  phase: Phase;
  goatsPlaced: number;           // 0..15
  goatsCaptured: number;
  winner: Winner;
  history: Move[];
}

export type Move =
  | { kind: "place"; to: NodeId }                                  // goat placement
  | { kind: "move"; from: NodeId; to: NodeId }                     // simple slide
  | { kind: "capture"; from: NodeId; over: NodeId; to: NodeId };   // tiger jump

export const CAPTURES_TO_WIN_FOR_TIGER = 5;

export function createInitialState(): GameState {
  const cells: Cell[] = Array(TOTAL_NODES).fill("empty");
  for (const t of STARTING_TIGERS) cells[t] = "tiger";
  return {
    cells,
    turn: "goat",            // goats place first
    phase: "placement",
    goatsPlaced: 0,
    goatsCaptured: 0,
    winner: null,
    history: [],
  };
}

// ---- Public state-machine helpers ----------------------------------------
// Spec-aligned aliases (getValidMoves / getPhase / isGameOver) so consumers
// outside the engine can speak the documented vocabulary without touching
// internals.

export function getPhase(state: GameState): Phase {
  return state.phase;
}

export function isGameOver(state: GameState): boolean {
  return state.phase === "ended" || state.winner !== null;
}

export function getValidMoves(state: GameState, player?: Player): Move[] {
  const moves = legalMoves(state);
  if (!player) return moves;
  return state.turn === player ? moves : [];
}

// ---- Move generation -----------------------------------------------------

export function legalMoves(state: GameState): Move[] {
  if (state.phase === "ended") return [];

  if (state.turn === "goat") {
    if (state.phase === "placement") {
      const moves: Move[] = [];
      for (let i = 0; i < state.cells.length; i++) {
        if (state.cells[i] === "empty") moves.push({ kind: "place", to: i });
      }
      return moves;
    }
    // movement phase: each goat slides to adjacent empty
    const moves: Move[] = [];
    for (let i = 0; i < state.cells.length; i++) {
      if (state.cells[i] !== "goat") continue;
      for (const n of ADJACENCY[i]) {
        if (state.cells[n] === "empty") moves.push({ kind: "move", from: i, to: n });
      }
    }
    return moves;
  }

  // tiger turn: every tiger may slide or jump (regardless of phase)
  const moves: Move[] = [];
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i] !== "tiger") continue;
    for (const n of ADJACENCY[i]) {
      if (state.cells[n] === "empty") moves.push({ kind: "move", from: i, to: n });
    }
    for (const j of JUMPS[i]) {
      if (state.cells[j.over] === "goat" && state.cells[j.land] === "empty") {
        moves.push({ kind: "capture", from: i, over: j.over, to: j.land });
      }
    }
  }
  return moves;
}

export function legalMovesFrom(state: GameState, from: NodeId): Move[] {
  return legalMoves(state).filter((m) => "from" in m && m.from === from);
}

export function legalDestinations(state: GameState, from: NodeId): { to: NodeId; capture: boolean }[] {
  return legalMovesFrom(state, from).map((m) =>
    m.kind === "capture" ? { to: m.to, capture: true } : { to: (m as { to: NodeId }).to, capture: false },
  );
}

// ---- Apply move ----------------------------------------------------------

export function applyMove(state: GameState, move: Move): GameState {
  const cells = state.cells.slice();
  let goatsPlaced = state.goatsPlaced;
  let goatsCaptured = state.goatsCaptured;
  let phase: Phase = state.phase;

  if (move.kind === "place") {
    if (state.turn !== "goat" || state.phase !== "placement") {
      throw new Error("Illegal placement");
    }
    if (cells[move.to] !== "empty") throw new Error("Cell occupied");
    cells[move.to] = "goat";
    goatsPlaced += 1;
  } else if (move.kind === "move") {
    // State-machine guard: goats cannot slide until placement phase ends.
    if (state.turn === "goat" && state.phase === "placement") {
      throw new Error("Goats cannot slide during placement phase");
    }
    if (cells[move.from] !== (state.turn === "goat" ? "goat" : "tiger")) {
      throw new Error("Wrong piece");
    }
    if (cells[move.to] !== "empty") throw new Error("Destination occupied");
    // Adjacency guard: a slide must follow a printed board edge.
    if (!ADJACENCY[move.from].includes(move.to)) {
      throw new Error("Move is not along a board edge");
    }
    cells[move.to] = cells[move.from];
    cells[move.from] = "empty";
  } else if (move.kind === "capture") {
    if (state.turn !== "tiger") throw new Error("Only tigers capture");
    if (cells[move.from] !== "tiger") throw new Error("No tiger at from");
    if (cells[move.over] !== "goat") throw new Error("No goat to capture");
    if (cells[move.to] !== "empty") throw new Error("Landing not empty");
    cells[move.from] = "empty";
    cells[move.over] = "empty";
    cells[move.to] = "tiger";
    goatsCaptured += 1;
  }

  // Phase transition for goats
  if (phase === "placement" && goatsPlaced >= TOTAL_GOATS_TO_PLACE) {
    // After all goats are placed, goats enter movement phase too.
    phase = "movement";
  }

  const nextTurn: Player = state.turn === "goat" ? "tiger" : "goat";
  let nextState: GameState = {
    cells,
    turn: nextTurn,
    phase,
    goatsPlaced,
    goatsCaptured,
    winner: null,
    history: state.history.concat(move),
  };

  nextState = checkEnd(nextState);
  return nextState;
}

// ---- Win conditions ------------------------------------------------------

export function checkEnd(state: GameState): GameState {
  // Tiger wins by capturing enough goats (a humane threshold; classic varies).
  if (state.goatsCaptured >= CAPTURES_TO_WIN_FOR_TIGER) {
    return { ...state, phase: "ended", winner: "tiger" };
  }
  // If next player has no legal moves:
  const moves = legalMoves(state);
  if (moves.length === 0) {
    // Stalemated player loses. Goats stalemating tigers = goat win.
    const winner: Winner = state.turn === "tiger" ? "goat" : "tiger";
    return { ...state, phase: "ended", winner };
  }
  return state;
}

// ---- Convenience ---------------------------------------------------------

export function tigerPositions(state: GameState): NodeId[] {
  const out: NodeId[] = [];
  for (let i = 0; i < state.cells.length; i++) if (state.cells[i] === "tiger") out.push(i);
  return out;
}

export function goatPositions(state: GameState): NodeId[] {
  const out: NodeId[] = [];
  for (let i = 0; i < state.cells.length; i++) if (state.cells[i] === "goat") out.push(i);
  return out;
}
