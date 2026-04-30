import { Card } from "@/components/ui/card";
import { countTigerThreats, evaluate, vulnerableGoats } from "@/game/ai";
import type { GameState } from "@/game/engine";
import { Activity, AlertTriangle, ShieldAlert } from "lucide-react";

interface OverlayPanelProps {
  state: GameState;
  enabled: boolean;
}

export function OverlayPanel({ state, enabled }: OverlayPanelProps) {
  if (!enabled) return null;
  const score = evaluate(state);
  const threats = countTigerThreats(state);
  const vulns = vulnerableGoats(state).length;

  // Score bar: clamp to a friendly range
  const norm = Math.max(-1, Math.min(1, score / 1500));
  const tigerPct = ((norm + 1) / 2) * 100;

  return (
    <Card className="p-4 shadow-soft bg-card/80 backdrop-blur-sm space-y-3 animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-accent" /> Strategy overlay
      </div>
      <div>
        <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
          <span>🐐 Goats</span><span>🐅 Tigers</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-saffron-gradient transition-all"
            style={{ width: `${tigerPct}%` }}
            aria-label={`Tiger advantage ${Math.round(tigerPct)}%`}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 font-mono">eval = {score}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-secondary/70 p-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <div>
            <p className="font-mono leading-none">{threats}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">tiger jumps</p>
          </div>
        </div>
        <div className="rounded-md bg-secondary/70 p-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <div>
            <p className="font-mono leading-none">{vulns}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">at-risk goats</p>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Red dashed rings on the board mark goats that can be jumped this turn. The bar shows positional balance.
      </p>
    </Card>
  );
}
