import { memo } from "react";
import { ADJACENCY, NODES, type NodeId } from "@/game/board";
import type { GameState, Move } from "@/game/engine";
import { vulnerableGoats } from "@/game/ai";
import { cn } from "@/lib/utils";

interface BoardProps {
  state: GameState;
  selected: NodeId | null;
  destinations: { to: NodeId; capture: boolean }[];
  hint: Move | null;
  showHints: boolean;
  showOverlay: boolean;
  capturedAt: NodeId | null;
  lastMove: Move | null;
  onNodeClick: (id: NodeId) => void;
}

const VIEW_W = 100;
const VIEW_H = 110;

// Build de-duplicated edges for rendering lines
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

function BoardImpl({
  state,
  selected,
  destinations,
  hint,
  showHints,
  showOverlay,
  capturedAt,
  lastMove,
  onNodeClick,
}: BoardProps) {
  const destSet = new Map(destinations.map((d) => [d.to, d.capture]));
  const vulnerable = showOverlay ? new Set(vulnerableGoats(state)) : new Set<NodeId>();

  const hintFrom = hint && "from" in hint ? hint.from : null;
  const hintTo = hint && "to" in hint ? hint.to : null;

  const lastFrom = lastMove && "from" in lastMove ? lastMove.from : null;
  const lastTo = lastMove && "to" in lastMove ? lastMove.to : null;

  return (
    <div className="relative w-full max-w-[560px] aspect-[100/110] mx-auto">
      <div
        className="absolute inset-0 rounded-[2rem] paper-texture shadow-elev"
        style={{ background: "hsl(var(--board-bg))", border: "1px solid hsl(var(--border))" }}
        aria-hidden
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="relative w-full h-full"
        role="img"
        aria-label="Aadu Puli Attam game board"
      >
        {/* Lines */}
        <g stroke="hsl(var(--board-line))" strokeWidth={0.45} strokeLinecap="round">
          {RENDER_EDGES.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />
          ))}
        </g>

        {/* Last-move trace */}
        {lastFrom !== null && lastTo !== null && (
          <line
            x1={NODES[lastFrom].x}
            y1={NODES[lastFrom].y}
            x2={NODES[lastTo].x}
            y2={NODES[lastTo].y}
            stroke="hsl(var(--accent))"
            strokeWidth={0.7}
            strokeDasharray="1.5 1.2"
            opacity={0.7}
          />
        )}

        {/* Hint trace */}
        {showHints && hintFrom !== null && hintTo !== null && (
          <line
            x1={NODES[hintFrom].x}
            y1={NODES[hintFrom].y}
            x2={NODES[hintTo].x}
            y2={NODES[hintTo].y}
            stroke="hsl(var(--node-highlight))"
            strokeWidth={0.9}
            strokeDasharray="1.2 1.2"
          />
        )}

        {/* Nodes */}
        {NODES.map((n) => {
          const cell = state.cells[n.id];
          const isSelected = selected === n.id;
          const dest = destSet.get(n.id);
          const isLegalDest = showHints && dest !== undefined;
          const isCaptureDest = showHints && dest === true;
          const isHintTarget = showHints && hint && "to" in hint && hint.to === n.id;
          const isVulnerable = vulnerable.has(n.id);

          return (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              className="cursor-pointer focus:outline-none"
              onClick={() => onNodeClick(n.id)}
              tabIndex={0}
              role="button"
              aria-label={`Node ${n.id}, ${cell}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onNodeClick(n.id);
                }
              }}
            >
              {/* Hover/legal-destination ring */}
              {(isLegalDest || isHintTarget) && (
                <circle
                  r={3.6}
                  fill="none"
                  stroke={isCaptureDest ? "hsl(var(--node-threat))" : "hsl(var(--node-highlight))"}
                  strokeWidth={0.6}
                  className="animate-pulse-ring origin-center"
                  style={{ transformBox: "fill-box" }}
                />
              )}

              {/* Vulnerable goat overlay marker */}
              {isVulnerable && cell === "goat" && (
                <circle r={3.4} fill="none" stroke="hsl(var(--node-threat))" strokeWidth={0.5} strokeDasharray="0.8 0.6" />
              )}

              {/* Base node */}
              <circle
                r={2.2}
                fill="hsl(var(--node))"
                stroke="hsl(var(--node-ring))"
                strokeWidth={0.4}
                className={cn(isSelected && "drop-shadow")}
              />

              {/* Pieces */}
              {cell === "tiger" && (
                <g className="origin-center" style={{ transformBox: "fill-box" }}>
                  <circle
                    r={2.6}
                    fill="hsl(var(--tiger))"
                    stroke="hsl(var(--tiger-ink))"
                    strokeWidth={0.4}
                    style={{ filter: "drop-shadow(0 0.4px 0.4px hsl(0 0% 0% / 0.4))" }}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={2.6}
                    fill="hsl(var(--tiger-ink))"
                    style={{ pointerEvents: "none", fontWeight: 700 }}
                  >
                    🐅
                  </text>
                </g>
              )}
              {cell === "goat" && capturedAt !== n.id && (
                <g className="origin-center" style={{ transformBox: "fill-box" }}>
                  <circle
                    r={2.4}
                    fill="hsl(var(--goat))"
                    stroke="hsl(var(--goat-ink))"
                    strokeWidth={0.35}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={2.4}
                    style={{ pointerEvents: "none" }}
                  >
                    🐐
                  </text>
                </g>
              )}
              {/* Capture flash */}
              {capturedAt === n.id && (
                <g className="origin-center animate-capture-flash" style={{ transformBox: "fill-box" }}>
                  <circle r={2.6} fill="hsl(var(--node-threat))" opacity={0.7} />
                </g>
              )}

              {/* Selected ring */}
              {isSelected && (
                <circle r={3.0} fill="none" stroke="hsl(var(--node-selected))" strokeWidth={0.6} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const Board = memo(BoardImpl);
