import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Board } from "@/components/game/Board";
import { StatusPanel } from "@/components/game/StatusPanel";
import { ControlsPanel } from "@/components/game/ControlsPanel";
import { OverlayPanel } from "@/components/game/OverlayPanel";
import { GameOverDialog } from "@/components/game/GameOverDialog";
import { Tutorial } from "@/components/game/Tutorial";
import { useGame, type Mode } from "@/hooks/useGame";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";

const Play = () => {
  const [params] = useSearchParams();
  const initialMode = (params.get("mode") as Mode | null) ?? "vs-ai-tigers";
  const game = useGame(initialMode);
  const [overOpen, setOverOpen] = useState(false);
  const [tutOpen, setTutOpen] = useState(false);

  // Sync mode from URL once
  useEffect(() => {
    if (initialMode && game.settings.mode !== initialMode) {
      game.newGame(initialMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (game.state.winner) setOverOpen(true);
  }, [game.state.winner]);

  const canUndo = useMemo(() => game.state.history.length > 0, [game.state.history.length]);

  return (
    <main className="min-h-screen px-4 sm:px-6 py-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Home</Link>
        </Button>
        <h1 className="font-display text-xl sm:text-2xl text-saffron">Aadu Puli Attam</h1>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setTutOpen(true)}>
          <GraduationCap className="h-4 w-4" /> Tutorial
        </Button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <section className="animate-fade-in">
          <Board
            state={game.state}
            selected={game.selected}
            destinations={game.destinations}
            hint={game.hint}
            showHints={game.settings.showHints || game.hint !== null}
            showOverlay={game.settings.showOverlay}
            capturedAt={game.capturedAt}
            lastMove={game.lastMove}
            onNodeClick={game.onNodeClick}
          />
          <p className="text-center text-xs text-muted-foreground mt-3">
            {game.state.phase === "placement" && game.state.turn === "goat"
              ? "Tap any empty point to place a goat."
              : "Tap one of your pieces, then tap a highlighted point to move."}
          </p>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <StatusPanel state={game.state} isAIThinking={game.isAIThinking} />
          <ControlsPanel
            settings={game.settings}
            onChange={game.setSettings}
            onHint={game.requestHint}
            onUndo={game.undo}
            onNewGame={() => game.newGame()}
            canUndo={canUndo}
          />
          <OverlayPanel state={game.state} enabled={game.settings.showOverlay} />
        </aside>
      </div>

      <GameOverDialog
        winner={game.state.winner}
        open={overOpen}
        onOpenChange={setOverOpen}
        onNewGame={() => {
          game.newGame();
          setOverOpen(false);
        }}
      />
      <Tutorial open={tutOpen} onOpenChange={setTutOpen} />
    </main>
  );
};

export default Play;
