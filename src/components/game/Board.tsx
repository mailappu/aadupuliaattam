import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ADJACENCY, NODES, type NodeId } from "@/game/board";
import type { GameState, Move } from "@/game/engine";
import { vulnerableGoats } from "@/game/ai";
import type { AnimationStep } from "@/animations/animationEngine";
import { cn } from "@/lib/utils";

interface BoardProps {
  state: GameState;
  selected: NodeId | null;
  destinations: { to: NodeId; capture: boolean }[];
  /** Optional move-quality scores (0..1) for the selected piece's destinations. */
  scoredDestinations?: { to: NodeId; capture: boolean; quality: number }[];
  hint: Move | null;
  showHints: boolean;
  showOverlay: boolean;
  capturedAt: NodeId | null;
  lastMove: Move | null;
  animation?: AnimationStep | null;
  /** Debug overlay: draws every adjacency edge faintly + node ids. */
  debug?: boolean;
  onNodeClick: (id: NodeId) => void;
}

const VIEW_W = 100;
const VIEW_H = 110;

const RENDER_EDGES: Array<[NodeId, NodeId]> = (() => {
  const seen = new Set<string>();
  const out: Array<[NodeId, NodeId]> = [];
  for (let a = 0; a < ADJACENCY.length; a++) {
    for (const b of ADJACENCY[a]) {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([a, b]);
    }
  }
  return out;
})();

interface VisualPiece {
  id: string;          // stable id across renders so SVG can transition
  kind: "tiger" | "goat";
  node: NodeId;        // current logical node
}

/** Derive piece list with stable ids by minimum-distance assignment to prior pieces. */
function diffPieces(prev: VisualPiece[], state: GameState): VisualPiece[] {
  const desired: { kind: "tiger" | "goat"; node: NodeId }[] = [];
  for (let i = 0; i < state.cells.length; i++) {
    const c = state.cells[i];
    if (c === "tiger" || c === "goat") desired.push({ kind: c, node: i });
  }
  const next: VisualPiece[] = [];
  const usedPrev = new Set<string>();
  // Greedy: for each desired piece, take nearest unused prev of same kind.
  for (const d of desired) {
    let bestKey = "";
    let bestDist = Infinity;
    for (const p of prev) {
      if (p.kind !== d.kind) continue;
      if (usedPrev.has(p.id)) continue;
      const a = NODES[p.node], b = NODES[d.node];
      const dist = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
      if (dist < bestDist) { bestDist = dist; bestKey = p.id; }
    }
    if (bestKey) {
      usedPrev.add(bestKey);
      next.push({ id: bestKey, kind: d.kind, node: d.node });
    } else {
      next.push({ id: `${d.kind}-${Math.random().toString(36).slice(2, 8)}`, kind: d.kind, node: d.node });
    }
  }
  return next;
}

function BoardImpl({
  state,
  selected,
  destinations,
  scoredDestinations,
  hint,
  showHints,
  showOverlay,
  capturedAt,
  lastMove,
  animation = null,
  debug = false,
  onNodeClick,
}: BoardProps) {
  const destSet = new Map(destinations.map((d) => [d.to, d.capture]));
  const scoreMap = new Map((scoredDestinations ?? []).map((d) => [d.to, d.quality]));
  const vulnerable = showOverlay ? new Set(vulnerableGoats(state)) : new Set<NodeId>();
  const hintFrom = hint && "from" in hint ? hint.from : null;
  const hintTo = hint && "to" in hint ? hint.to : null;
  const lastFrom = lastMove && "from" in lastMove ? lastMove.from : null;
  const lastTo = lastMove && "to" in lastMove ? lastMove.to : null;

  // Maintain stable visual pieces for smooth glide tweens.
  const prevRef = useRef<VisualPiece[]>([]);
  const pieces = useMemo(() => {
    const next = diffPieces(prevRef.current, state);
    prevRef.current = next;
    return next;
  }, [state]);

  // Confetti / particles container — driven by capturedAt
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);
  useEffect(() => {
    if (capturedAt === null) return;
    const n = NODES[capturedAt];
    const burst = Array.from({ length: 10 }).map((_, i) => ({
      id: Date.now() + i,
      x: n.x,
      y: n.y,
      angle: (i / 10) * Math.PI * 2,
    }));
    setParticles(burst);
    const t = setTimeout(() => setParticles([]), 700);
    return () => clearTimeout(t);
  }, [capturedAt]);

  return (
    <div className="relative w-full max-w-[560px] aspect-[100/110] mx-auto select-none">
      <div
        className="absolute inset-0 rounded-[2rem] paper-texture shadow-elev"
        style={{ background: "hsl(var(--board-bg))", border: "1px solid hsl(var(--border))" }}
        aria-hidden
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="relative w-full h-full touch-manipulation"
        role="img"
        aria-label="Aadu Puli Attam game board"
      >
        {/* Lines */}
        <g stroke="hsl(var(--board-line))" strokeWidth={0.45} strokeLinecap="round">
          {RENDER_EDGES.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />
          ))}
        </g>

        {/* Debug overlay: every adjacency edge in faint cyan to verify graph topology. */}
        {debug && (
          <g stroke="hsl(190 80% 50%)" strokeWidth={0.18} strokeDasharray="0.6 0.6" opacity={0.55}>
            {RENDER_EDGES.map(([a, b]) => (
              <line key={`dbg-${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />
            ))}
          </g>
        )}

        {/* Last-move trace */}
        {lastFrom !== null && lastTo !== null && (
          <line
            x1={NODES[lastFrom].x} y1={NODES[lastFrom].y}
            x2={NODES[lastTo].x} y2={NODES[lastTo].y}
            stroke="hsl(var(--accent))" strokeWidth={0.7} strokeDasharray="1.5 1.2" opacity={0.7}
          />
        )}

        {/* Animation feedback: depart pulse on origin, land glow on destination.
            Keyed by step.id so React remounts the circles per move and replays
            the CSS animations cleanly. Pure visual; no engine dependency. */}
        {animation && animation.origin !== null && (
          <circle
            key={`depart-${animation.id}`}
            cx={NODES[animation.origin].x}
            cy={NODES[animation.origin].y}
            r={2.6}
            fill="none"
            stroke={animation.arc === "lunge" ? "hsl(var(--node-threat))" : "hsl(var(--node-selected))"}
            strokeWidth={0.7}
            className="animate-depart-pulse origin-center pointer-events-none"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        )}
        {animation && (
          <circle
            key={`land-${animation.id}`}
            cx={NODES[animation.destination].x}
            cy={NODES[animation.destination].y}
            r={2.4}
            fill="none"
            stroke="hsl(var(--node-highlight))"
            strokeWidth={0.7}
            className="animate-land-glow origin-center pointer-events-none"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        )}

        {/* Hint trace */}
        {showHints && hintFrom !== null && hintTo !== null && (
          <line
            x1={NODES[hintFrom].x} y1={NODES[hintFrom].y}
            x2={NODES[hintTo].x} y2={NODES[hintTo].y}
            stroke="hsl(var(--node-highlight))" strokeWidth={0.9} strokeDasharray="1.2 1.2"
          />
        )}

        {/* Click targets + node markers */}
        {NODES.map((n) => {
          const isSelected = selected === n.id;
          const dest = destSet.get(n.id);
          const isLegalDest = showHints && dest !== undefined;
          const isCaptureDest = showHints && dest === true;
          const isHintTarget = showHints && hint && "to" in hint && hint.to === n.id;
          const isVulnerable = vulnerable.has(n.id);

          return (
            <g key={`hit-${n.id}`} transform={`translate(${n.x} ${n.y})`}>
              {/* Larger transparent hit area for touch */}
              <circle
                r={5}
                fill="transparent"
                onClick={() => onNodeClick(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNodeClick(n.id); }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Node ${n.id}`}
                style={{ cursor: "pointer", outline: "none" }}
              />
              {(isLegalDest || isHintTarget) && (
                <circle
                  r={3.6}
                  fill="none"
                  stroke={isCaptureDest ? "hsl(var(--node-threat))" : "hsl(var(--node-highlight))"}
                  strokeWidth={0.6}
                  className="animate-pulse-ring origin-center pointer-events-none"
                  style={{ transformBox: "fill-box" }}
                />
              )}
              {isVulnerable && state.cells[n.id] === "goat" && (
                <circle r={3.4} fill="none" stroke="hsl(var(--node-threat))" strokeWidth={0.5} strokeDasharray="0.8 0.6" className="pointer-events-none" />
              )}
              <circle
                r={2.0}
                fill="hsl(var(--node))"
                stroke="hsl(var(--node-ring))"
                strokeWidth={0.35}
                className={cn("pointer-events-none", isSelected && "drop-shadow")}
              />
              {isSelected && (
                <circle r={3.0} fill="none" stroke="hsl(var(--node-selected))" strokeWidth={0.6} className="pointer-events-none" />
              )}
              {/* Strategy overlay: quality ring on legal destinations.
                  Hue lerps red(0°) → amber(45°) → green(120°) by quality. */}
              {scoreMap.has(n.id) && (() => {
                const q = scoreMap.get(n.id)!;
                const hue = Math.round(q * 120); // 0=red, 60=yellow, 120=green
                return (
                  <circle
                    r={4.4}
                    fill="none"
                    stroke={`hsl(${hue} 70% 45%)`}
                    strokeWidth={0.55}
                    opacity={0.85}
                    className="pointer-events-none"
                  />
                );
              })()}
              {/* Debug: node id label */}
              {debug && (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={1.6}
                  fill="hsl(190 80% 30%)"
                  y={-3.4}
                  className="pointer-events-none"
                  style={{ fontFamily: "monospace" }}
                >
                  {n.id}
                </text>
              )}
            </g>
          );
        })}

        {/* Pieces — rendered with stable ids and CSS transitions for glide tweens */}
        <g>
          {pieces.map((p) => {
            const n = NODES[p.node];
            const isCapturing = capturedAt !== null && p.kind === "goat" && p.node === capturedAt;
            return (
              <g
                key={p.id}
                style={{
                  transform: `translate(${n.x}px, ${n.y}px)`,
                  transition: "transform 320ms cubic-bezier(0.34, 1.4, 0.64, 1)",
                }}
                className={cn("pointer-events-none", isCapturing && "animate-capture-flash origin-center")}
              >
                {p.kind === "tiger" ? (
                  <>
                    <circle r={2.7} fill="hsl(var(--tiger))" stroke="hsl(var(--tiger-ink))" strokeWidth={0.4} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={2.6} style={{ fontWeight: 700 }}>🐅</text>
                  </>
                ) : (
                  <>
                    <circle r={2.4} fill="hsl(var(--goat))" stroke="hsl(var(--goat-ink))" strokeWidth={0.35} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={2.4}>🐐</text>
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Capture particles */}
        <g>
          {particles.map((p) => {
            const dx = Math.cos(p.angle) * 7;
            const dy = Math.sin(p.angle) * 7;
            return (
              <circle
                key={p.id}
                r={0.9}
                fill="hsl(var(--node-threat))"
                style={{
                  transform: `translate(${p.x + dx}px, ${p.y + dy}px)`,
                  opacity: 0,
                  transition: "transform 600ms ease-out, opacity 600ms ease-out",
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export const Board = memo(BoardImpl);
