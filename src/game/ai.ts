// Stronger AI for Aadu Puli Attam.
// - Iterative deepening with time budget
// - Alpha-beta with transposition table (Zobrist-style hashing using string keys)
// - Move ordering: captures first, then TT best-move, then prior-iteration scores
// - Opening book for early goat placements (centralized chains)
// - Reuses pure engine; never mutates input state

import { ADJACENCY, JUMPS, TOTAL_NODES, type NodeId } from "./board";
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
  depth: number;
  ms: number;
}

// ---- Evaluation ----------------------------------------------------------
// Same shape as before but slightly tuned weights for stronger play.
// + > 0 favours tigers, < 0 favours goats.

export function evaluate(state: GameState): number {
  if (state.winner === "tiger") return 100_000;
  if (state.winner === "goat") return -100_000;

  let score = 0;
  score += state.goatsCaptured * 240;

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
  score += tigerMoves * 5;
  score += tigerThreats * 110;

  let trappedTigers = 0;
  for (const t of tigers) {
    let canDo = false;
    for (const n of ADJACENCY[t]) if (state.cells[n] === "empty") { canDo = true; break; }
    if (!canDo) {
      for (const j of JUMPS[t]) {
        if (state.cells[j.over] === "goat" && state.cells[j.land] === "empty") { canDo = true; break; }
      }
    }
    if (!canDo) trappedTigers += 1;
  }
  score -= trappedTigers * 420;

  // Goat structural safety
  let safeGoats = 0;
  for (const gpos of goats) {
    let safe = true;
    for (const t of tigers) {
      const j = JUMPS[t].find((j) => j.over === gpos);
      if (j && state.cells[j.land] === "empty") { safe = false; break; }
    }
    if (safe) safeGoats += 1;
  }
  score -= safeGoats * 8;

  // Tigers prefer not to be cornered (count of own neighbors)
  for (const t of tigers) score += ADJACENCY[t].length * 0.3;

  return score;
}

// ---- Transposition table -------------------------------------------------

type TTFlag = "exact" | "lower" | "upper";
interface TTEntry { depth: number; value: number; flag: TTFlag; best?: Move }
const TT = new Map<string, TTEntry>();
const TT_MAX = 200_000;

function hash(state: GameState): string {
  // Compact state key: cells + turn + phase + goatsPlaced + captures
  let s = "";
  for (let i = 0; i < state.cells.length; i++) {
    const c = state.cells[i];
    s += c === "empty" ? "." : c === "tiger" ? "T" : "G";
  }
  return `${s}|${state.turn[0]}|${state.phase[0]}|${state.goatsPlaced}|${state.goatsCaptured}`;
}

function ttSet(key: string, e: TTEntry) {
  if (TT.size > TT_MAX) {
    // simple eviction: clear half
    let n = TT.size / 2;
    for (const k of TT.keys()) { TT.delete(k); if (--n <= 0) break; }
  }
  TT.set(key, e);
}

// ---- Move ordering -------------------------------------------------------

function orderMoves(moves: Move[], best?: Move): Move[] {
  const arr = moves.slice();
  arr.sort((a, b) => priority(b, best) - priority(a, best));
  return arr;
}
function priority(m: Move, best?: Move): number {
  let p = 0;
  if (best && sameMove(m, best)) p += 1000;
  if (m.kind === "capture") p += 100;
  return p;
}
function sameMove(a: Move, b: Move): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "place" && b.kind === "place") return a.to === b.to;
  if (a.kind === "move" && b.kind === "move") return a.from === b.from && a.to === b.to;
  if (a.kind === "capture" && b.kind === "capture") return a.from === b.from && a.over === b.over && a.to === b.to;
  return false;
}

// ---- Negamax with alpha-beta + TT ---------------------------------------

function search(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  counter: { n: number },
  deadline: number,
): { score: number; best?: Move; aborted?: boolean } {
  if (Date.now() > deadline) return { score: 0, aborted: true };
  counter.n += 1;

  const key = hash(state);
  const tt = TT.get(key);
  if (tt && tt.depth >= depth) {
    if (tt.flag === "exact") return { score: tt.value, best: tt.best };
    if (tt.flag === "lower" && tt.value > alpha) alpha = tt.value;
    else if (tt.flag === "upper" && tt.value < beta) beta = tt.value;
    if (alpha >= beta) return { score: tt.value, best: tt.best };
  }

  if (depth === 0 || state.phase === "ended") {
    return { score: evaluate(state) };
  }

  const moves = legalMoves(state);
  if (moves.length === 0) return { score: evaluate(state) };
  const ordered = orderMoves(moves, tt?.best);

  let bestMove: Move | undefined;
  if (state.turn === "tiger") {
    let value = -Infinity;
    for (const m of ordered) {
      const child = applyMove(state, m);
      const r = search(child, depth - 1, alpha, beta, counter, deadline);
      if (r.aborted) return { score: 0, aborted: true };
      if (r.score > value) { value = r.score; bestMove = m; }
      if (value > alpha) alpha = value;
      if (alpha >= beta) break;
    }
    storeTT(key, depth, value, alpha, beta, bestMove);
    return { score: value, best: bestMove };
  } else {
    let value = Infinity;
    for (const m of ordered) {
      const child = applyMove(state, m);
      const r = search(child, depth - 1, alpha, beta, counter, deadline);
      if (r.aborted) return { score: 0, aborted: true };
      if (r.score < value) { value = r.score; bestMove = m; }
      if (value < beta) beta = value;
      if (alpha >= beta) break;
    }
    storeTT(key, depth, value, alpha, beta, bestMove);
    return { score: value, best: bestMove };
  }
}

function storeTT(key: string, depth: number, value: number, alphaOrig: number, betaOrig: number, best?: Move) {
  let flag: TTFlag = "exact";
  if (value <= alphaOrig) flag = "upper";
  else if (value >= betaOrig) flag = "lower";
  ttSet(key, { depth, value, flag, best });
}

// ---- Opening book (goat placement, first ~6 plies) ----------------------
// Centralized chain that backs goats up — a goat with a friend behind it
// is jump-proof along that line.
const GOAT_OPENING: NodeId[] = [10, 8, 12, 13, 17, 15];

// ---- Public chooser ------------------------------------------------------

const TIME_BUDGET: Record<Difficulty, number> = { easy: 60, medium: 350, hard: 1100 };
const MAX_DEPTH:  Record<Difficulty, number> = { easy: 2, medium: 5, hard: 7 };

export function chooseAIMove(state: GameState, player: Player, difficulty: Difficulty): AIDecision | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  const start = Date.now();

  // Easy mode: capture if obvious, else random with small heuristic bias
  if (difficulty === "easy") {
    const caps = moves.filter((m) => m.kind === "capture");
    const pool = caps.length ? caps : moves;
    const move = pool[Math.floor(Math.random() * pool.length)];
    return {
      move,
      score: evaluate(applyMove(state, move)),
      explanation: explain(move, state, "easy"),
      considered: pool.length,
      depth: 0,
      ms: Date.now() - start,
    };
  }

  // Opening book: only for goat side, only during placement, only if cell empty
  if (player === "goat" && state.phase === "placement" && state.history.length < 12) {
    for (const id of GOAT_OPENING) {
      if (state.cells[id] === "empty") {
        const move: Move = { kind: "place", to: id };
        return {
          move,
          score: evaluate(applyMove(state, move)),
          explanation: "Opening book: building a centralised, jump-proof chain.",
          considered: 1,
          depth: 0,
          ms: Date.now() - start,
        };
      }
    }
  }

  const deadline = start + TIME_BUDGET[difficulty];
  const maxDepth = MAX_DEPTH[difficulty];
  const counter = { n: 0 };

  let bestMove: Move = moves[0];
  let bestScore = player === "tiger" ? -Infinity : Infinity;
  let reachedDepth = 0;

  // Iterative deepening
  for (let depth = 1; depth <= maxDepth; depth++) {
    if (Date.now() > deadline) break;
    let curBest: Move | undefined;
    let curScore = player === "tiger" ? -Infinity : Infinity;
    let alpha = -Infinity, beta = Infinity;
    const ordered = orderMoves(moves, bestMove);
    let aborted = false;

    for (const m of ordered) {
      const child = applyMove(state, m);
      const r = search(child, depth - 1, alpha, beta, counter, deadline);
      if (r.aborted) { aborted = true; break; }
      if (player === "tiger") {
        if (r.score > curScore) { curScore = r.score; curBest = m; }
        if (curScore > alpha) alpha = curScore;
      } else {
        if (r.score < curScore) { curScore = r.score; curBest = m; }
        if (curScore < beta) beta = curScore;
      }
      if (alpha >= beta) break;
    }
    if (!aborted && curBest) {
      bestMove = curBest;
      bestScore = curScore;
      reachedDepth = depth;
    } else {
      break;
    }
  }

  return {
    move: bestMove,
    score: bestScore,
    explanation: explain(bestMove, state, difficulty),
    considered: counter.n,
    depth: reachedDepth,
    ms: Date.now() - start,
  };
}

function explain(move: Move, state: GameState, difficulty: Difficulty): string {
  if (move.kind === "capture") {
    return `Capture: jumping over a goat removes a defender. (${difficulty})`;
  }
  if (move.kind === "place") {
    const after = applyMove(state, move);
    const before = countTigerThreats(state);
    const aft = countTigerThreats(after);
    if (aft < before) return `Placing here blocks ${before - aft} tiger jump${before - aft === 1 ? "" : "s"}.`;
    return `Placing here builds a defensive chain.`;
  }
  if (state.turn === "tiger") return `Repositioning to open future capture lines.`;
  return `Sliding to tighten the net around the tigers.`;
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

// Re-export TOTAL_NODES so callers don't need to import from board separately.
export { TOTAL_NODES };
