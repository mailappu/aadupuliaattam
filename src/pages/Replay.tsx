import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Board } from "@/components/game/Board";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Pause, Play as PlayIcon, SkipBack, SkipForward } from "lucide-react";
import { decodeHistory, replayToState } from "@/game/share";
import type { Move } from "@/game/engine";
import { toast } from "@/hooks/use-toast";

const Replay = () => {
  const [params] = useSearchParams();
  const code = params.get("g") ?? "";
  const [history, setHistory] = useState<Move[]>([]);
  const [ply, setPly] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);

  useEffect(() => {
    try {
      const h = decodeHistory(code);
      setHistory(h);
      setPly(0);
    } catch {
      toast({ title: "Invalid replay link", description: "The share code couldn't be decoded.", variant: "destructive" });
    }
  }, [code]);

  const state = useMemo(() => replayToState(history, ply), [history, ply]);
  const lastMove = ply > 0 ? history[ply - 1] : null;

  useEffect(() => {
    if (!playing) return;
    if (ply >= history.length) { setPlaying(false); return; }
    const t = setTimeout(() => setPly((p) => p + 1), speed);
    return () => clearTimeout(t);
  }, [playing, ply, history.length, speed]);

  return (
    <main className="min-h-screen px-4 sm:px-6 py-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Home</Link>
        </Button>
        <h1 className="font-display text-xl sm:text-2xl text-saffron">Replay</h1>
        <Button asChild variant="ghost" size="sm">
          <Link to="/play">New game</Link>
        </Button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <section className="animate-fade-in">
          <Board
            state={state}
            selected={null}
            destinations={[]}
            hint={null}
            showHints={false}
            showOverlay={false}
            capturedAt={null}
            lastMove={lastMove}
            onNodeClick={() => undefined}
          />
          <p className="text-center text-xs text-muted-foreground mt-3">
            Move {ply} / {history.length}
          </p>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <Card className="p-4 shadow-soft bg-card/80 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Turn</p>
                <p className="font-display text-xl">
                  {state.turn === "tiger" ? "🐅 Tigers" : "🐐 Goats"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Captures</p>
                <p className="font-mono text-lg">{state.goatsCaptured} / 5</p>
              </div>
            </div>
            <Slider
              value={[ply]}
              max={Math.max(0, history.length)}
              step={1}
              onValueChange={(v) => { setPly(v[0]); setPlaying(false); }}
              aria-label="Replay timeline"
            />
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="icon" onClick={() => { setPly(0); setPlaying(false); }} aria-label="Restart">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setPly((p) => Math.max(0, p - 1))} aria-label="Previous move">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button size="lg" className="bg-teak-gradient flex-1 gap-2" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                {playing ? "Pause" : "Play"}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setPly((p) => Math.min(history.length, p + 1))} aria-label="Next move">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                Playback speed
              </p>
              <Slider
                value={[1200 - speed]}
                min={0}
                max={1100}
                step={50}
                onValueChange={(v) => setSpeed(1200 - v[0])}
                aria-label="Playback speed"
              />
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
};

export default Replay;
