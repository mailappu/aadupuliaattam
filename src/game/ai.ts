// Asymmetric AI for Aadu Puli Attam.
// Tigers: shallow minimax with alpha-beta and capture-priority heuristic.
// Goats: heuristic driven (block tiger jumps, build chains, avoid capture).
// Returns chosen move + a human-readable explanation for the strategy overlay.

import { ADJACENCY, JUMPS, type NodeId } from "./board";
import {
  applyMove,
  legalMoves,
  type GameState,
  type Move,
  type Player,
} from "./engine";

export type Difficulty = "easy" | "medium" | "hard";

export interface AIDecision {
  move: Move;
  score: number;
  explanation: string;
  considered: number;
}

// ---- Heuristic evaluation ------------------------------------------------
// Positive = good for tigers, negative = good for goats. Engine works as
// a single signed score so minimax can max for tigers / min for goats.

export function evaluate(state: GameState): number {
  if (state.winner === "tiger") return 10_000;
  if (state.winner === "goat") return -10_000;

  let score = 0;
  // Captured goats are huge for tigers
  score += state.goatsCaptured * 220;

  // Tiger mobility — count legal tiger moves and capture threats.
  const tigers: NodeId[] = [];
  const goats: NodeId[] = [];
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i] === "tiger") tigers.push(i);
    else if (state.cells[i] === "goat") goats.push(i);
  }

  let tigerMoves = 0;
  let tigerThreats = 0;
  for (const t of tigers) {
    for (const n of ADJACENCY[t]) if (state.cells[n] === "empty") tigerMoves += 1;
    for (const j of JUMPS[t]) {
      if (state.cells[j.over] === "goat" && state.cells[j.land] === "empty") tigerThreats += 1;
    }
  }
  score += tigerMoves * 4;
  score += tigerThreats * 90;

  // Goats benefit by reducing tiger mobility AND by being numerous & connected.
  // Penalty for tigers when goats are densely surrounding them.
  let trappedTigers = 0;
  for (const t of tigers) {
    let canDoAnything = false;
    for (const n of ADJACENCY[t]) if (state.cells[n] === "empty") { canDoAnything = true; break; }
    if (!canDoAnything) {
      for (const j of JUMPS[t]) {
        if (state.cells[j.over] === "goat" && state.cells[j.land] === "empty") {
          canDoAnything = true; break;
        }
      }
    }
    if (!canDoAnything) trappedTigers += 1;
  }
  score -= trappedTigers * 350;

  // Goats prefer to be backed up (a goat with a friendly behind it on the same
  // line cannot be jumped). Reward chain structure for goats.
  let safeGoats = 0;
  for (const gpos of goats) {
    let safe = true;
    for (const t of tigers) {
      const jumpFromT = JUMPS[t].find((j) => j.over === gpos);
      if (jumpFromT && state.cells[jumpFromT.land] === "empty") { safe = false; break; }
    }
    if (safe) safeGoats += 1;
  }
  score -= safeGoats * 6;

  return score;
}

// ---- Minimax with alpha-beta --------------------------------------------

function search(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  counter: { n: number },
): number {
  counter.n += 1;
  if (depth === 0 || state.phase === "ended") return evaluate(state);

  const moves = orderMoves(state, legalMoves(state));
  if (moves.length === 0) return evaluate(state);

  if (state.turn === "tiger") {
    let best = -Infinity;
    for (const m of moves) {
      const v = search(applyMove(state, m), depth - 1, alpha, beta, counter);
      if (v > best) best = v;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const v = search(applyMove(state, m), depth - 1, alpha, beta, counter);
      if (v < best) best = v;
      if (best < beta) beta = best;
      if (alpha >= beta) break;
    }
    return best;
  }
}

function orderMoves(_state: GameState, moves: Move[]): Move[] {
  // Captures first → better alpha-beta cuts.
  return moves.slice().sort((a, b) => (a.kind === "capture" ? -1 : 0) - (b.kind === "capture" ? -1 : 0));
}

// ---- Public AI ----------------------------------------------------------

const DEPTH_BY_DIFFICULTY: Record<Difficulty, number> = { easy: 1, medium: 3, hard: 4 };

export function chooseAIMove(state: GameState, player: Player, difficulty: Difficulty): AIDecision | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;

  const depth = DEPTH_BY_DIFFICULTY[difficulty];
  const counter = { n: 0 };

  // For easy mode, mix some randomness.
  if (difficulty === "easy") {
    // Prefer captures if available (still feel like a tiger), else random.
    const caps = moves.filter((m) => m.kind === "capture");
    const pool = caps.length ? caps : moves;
    const move = pool[Math.floor(Math.random() * pool.length)];
    return {
      move,
      score: evaluate(applyMove(state, move)),
      explanation: explain(move, state, "easy"),
      considered: pool.length,
    };
  }

  let bestMove: Move = moves[0];
  let bestScore = player === "tiger" ? -Infinity : Infinity;

  for (const m of orderMoves(state, moves)) {
    const v = search(applyMove(state, m), depth - 1, -Infinity, Infinity, counter);
    if (player === "tiger" ? v > bestScore : v < bestScore) {
      bestScore = v;
      bestMove = m;
    }
  }

  return {
    move: bestMove,
    score: bestScore,
    explanation: explain(bestMove, state, difficulty),
    considered: counter.n,
  };
}

function explain(move: Move, state: GameState, difficulty: Difficulty): string {
  if (move.kind === "capture") {
    return `Capture: jumping over a goat removes a defender. (${difficulty} AI)`;
  }
  if (move.kind === "place") {
    // Note threats blocked
    const after = applyMove(state, move);
    const threatsBefore = countTigerThreats(state);
    const threatsAfter = countTigerThreats(after);
    if (threatsAfter < threatsBefore) {
      return `Placing here blocks ${threatsBefore - threatsAfter} tiger jump${
        threatsBefore - threatsAfter === 1 ? "" : "s"
      }.`;
    }
    return `Placing here builds a defensive chain.`;
  }
  // simple slide
  if (state.turn === "tiger") {
    return `Repositioning to open future capture lines.`;
  }
  return `Sliding to tighten the net around tigers.`;
}

export function countTigerThreats(state: GameState): number {
  let n = 0;
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i] !== "tiger") continue;
    for (const j of JUMPS[i]) {
      if (state.cells[j.over] === "goat" && state.cells[j.land] === "empty") n += 1;
    }
  }
  return n;
}

export function vulnerableGoats(state: GameState): NodeId[] {
  const set = new Set<NodeId>();
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i] !== "tiger") continue;
    for (const j of JUMPS[i]) {
      if (state.cells[j.over] === "goat" && state.cells[j.land] === "empty") set.add(j.over);
    }
  }
  return [...set];
}
