import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GameState } from "@/game/engine";
import { CAPTURES_TO_WIN_FOR_TIGER } from "@/game/engine";
import { Loader2 } from "lucide-react";

interface StatusPanelProps {
  state: GameState;
  isAIThinking: boolean;
}

export function StatusPanel({ state, isAIThinking }: StatusPanelProps) {
  const turnLabel = state.turn === "tiger" ? "Tigers" : "Goats";
  const remainingPlace = Math.max(0, 15 - state.goatsPlaced);

  return (
    <Card className="p-4 shadow-soft bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Turn</p>
          <h3 className="font-display text-2xl flex items-center gap-2">
            <span aria-hidden>{state.turn === "tiger" ? "🐅" : "🐐"}</span>
            {turnLabel}
            {isAIThinking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="AI thinking" />}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{state.phase} phase</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="font-mono">
            🐐 captured {state.goatsCaptured} / {CAPTURES_TO_WIN_FOR_TIGER}
          </Badge>
          {state.phase === "placement" && (
            <Badge variant="outline" className="font-mono">
              🐐 to place {remainingPlace}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
