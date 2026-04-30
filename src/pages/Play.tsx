import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Board } from "@/components/game/Board";
import { StatusPanel } from "@/components/game/StatusPanel";
import { ControlsPanel } from "@/components/game/ControlsPanel";
import { OverlayPanel } from "@/components/game/OverlayPanel";
import { GameOverDialog } from "@/components/game/GameOverDialog";
import { Tutorial } from "@/components/game/Tutorial";
import { MuteToggle } from "@/components/game/MuteToggle";
import { SettingsDialog } from "@/components/game/SettingsDialog";
import { useGame, type Mode } from "@/hooks/useGame";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, GraduationCap, Wrench } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Play = () => {
  const [params] = useSearchParams();
  const initialMode = (params.get("mode") as Mode | null) ?? "vs-ai-tigers";
  const initialDifficulty = (params.get("difficulty") as "easy" | "medium" | "hard" | null) ?? "medium";
  const p1Name = params.get("p1") ?? "Player 1";
  const p2Name = params.get("p2") ?? "Player 2";
  const p1Side = (params.get("p1side") as "goat" | "tiger" | null) ?? "goat";
  const game = useGame(initialMode, initialDifficulty);
  const [overOpen, setOverOpen] = useState(false);
  const [tutOpen, setTutOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (initialMode && (game.settings.mode !== initialMode || game.settings.difficulty !== initialDifficulty)) {
      game.newGame(initialMode, initialDifficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (game.state.winner) setOverOpen(true); }, [game.state.winner]);

  const canUndo = useMemo(() => game.state.history.length > 0, [game.state.history.length]);

  const controls = (
    <ControlsPanel
      settings={game.settings}
      onChange={game.setSettings}
      onHint={game.requestHint}
      onUndo={game.undo}
      onNewGame={() => game.newGame()}
      canUndo={canUndo}
      history={game.state.history}
    />
  );

  return (
    <main className="min-h-screen px-4 sm:px-6 py-4 sm:py-6 pb-24 lg:pb-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Home</Link>
        </Button>
        <h1 className="font-display text-xl sm:text-2xl text-saffron">Aadu Puli Attam</h1>
        <div className="flex items-center gap-1">
          <MuteToggle />
          <Button variant="ghost" size="icon" onClick={() => setTutOpen(true)} aria-label="Tutorial">
            <GraduationCap className="h-5 w-5" />
          </Button>
          <SettingsDialog settings={game.settings} onChange={game.setSettings} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <section className="animate-fade-in">
          {initialMode === "pass-and-play" && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {([
                { name: p1Name, side: p1Side },
                { name: p2Name, side: p1Side === "goat" ? "tiger" : "goat" },
              ] as { name: string; side: "goat" | "tiger" }[]).map((p) => {
                const active = game.state.turn === p.side && !game.state.winner;
                return (
                  <div
                    key={p.name + p.side}
                    className={`rounded-xl border-2 p-2.5 flex items-center gap-2 transition-all ${
                      active ? "border-accent bg-accent/10 shadow-soft" : "border-border bg-card/50"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden>{p.side === "goat" ? "🐐" : "🐅"}</span>
                    <div className="min-w-0">
                      <p className="font-display text-sm leading-tight truncate">{p.name}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {p.side === "goat" ? "Goats" : "Tigers"}{active ? " · turn" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Board
            state={game.state}
            selected={game.selected}
            destinations={game.destinations}
            hint={game.hint}
            showHints={game.settings.showHints || game.hint !== null}
            showOverlay={game.settings.showOverlay}
            capturedAt={game.capturedAt}
            lastMove={game.lastMove}
            animation={game.animation}
            onNodeClick={game.onNodeClick}
          />
          <p className="text-center text-xs text-muted-foreground mt-3 px-4">
            {game.state.phase === "placement" && game.state.turn === "goat"
              ? "Tap any empty point to place a goat."
              : "Tap one of your pieces, then tap a highlighted point to move."}
          </p>
          <div className="lg:hidden mt-4">
            <StatusPanel state={game.state} isAIThinking={game.isAIThinking} />
          </div>
        </section>

        <aside className="hidden lg:block space-y-4 lg:sticky lg:top-6">
          <StatusPanel state={game.state} isAIThinking={game.isAIThinking} />
          {controls}
          <OverlayPanel state={game.state} enabled={game.settings.showOverlay} />
        </aside>
      </div>

      {/* Mobile bottom-sheet for controls */}
      {isMobile && (
        <div className="fixed bottom-4 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="bg-teak-gradient shadow-elev gap-2 pointer-events-auto">
                <Wrench className="h-4 w-4" /> Controls
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <div className="space-y-4 max-w-md mx-auto pt-2">
                {controls}
                <OverlayPanel state={game.state} enabled={game.settings.showOverlay} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <GameOverDialog
        winner={game.state.winner}
        open={overOpen}
        onOpenChange={setOverOpen}
        onNewGame={() => { game.newGame(); setOverOpen(false); }}
      />
      <Tutorial open={tutOpen} onOpenChange={setTutOpen} />
    </main>
  );
};

export default Play;
