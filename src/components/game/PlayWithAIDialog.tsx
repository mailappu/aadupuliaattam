import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import type { Difficulty } from "@/game/ai";

type Side = "goat" | "tiger" | "random";

export function PlayWithAIDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [side, setSide] = useState<Side>("goat");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const start = () => {
    const chosen: "goat" | "tiger" = side === "random" ? (Math.random() < 0.5 ? "goat" : "tiger") : side;
    // Mode names reflect which side the AI plays.
    const mode = chosen === "goat" ? "vs-ai-tigers" : "vs-ai-goats";
    onOpenChange(false);
    navigate(`/play?mode=${mode}&difficulty=${difficulty}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Play with AI</DialogTitle>
          <DialogDescription>Pick your side and difficulty, then start the hunt.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Your side</Label>
            <RadioGroup
              value={side}
              onValueChange={(v) => setSide(v as Side)}
              className="grid grid-cols-3 gap-2"
            >
              {([
                { id: "goat", label: "Goats", emoji: "🐐", sub: "15 pieces" },
                { id: "tiger", label: "Tigers", emoji: "🐅", sub: "3 pieces" },
                { id: "random", label: "Random", emoji: "🎲", sub: "Surprise me" },
              ] as { id: Side; label: string; emoji: string; sub: string }[]).map((opt) => (
                <Label
                  key={opt.id}
                  htmlFor={`side-${opt.id}`}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                    side === opt.id
                      ? "border-accent bg-accent/10 shadow-soft"
                      : "border-border bg-secondary/50 hover:border-accent/50"
                  }`}
                >
                  <RadioGroupItem id={`side-${opt.id}`} value={opt.id} className="sr-only" />
                  <span className="text-3xl" aria-hidden>{opt.emoji}</span>
                  <span className="font-display text-base">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.sub}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Difficulty</Label>
            <RadioGroup
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as Difficulty)}
              className="grid grid-cols-3 gap-2"
            >
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <Label
                  key={d}
                  htmlFor={`diff-${d}`}
                  className={`flex items-center justify-center rounded-xl border-2 px-3 py-2.5 capitalize cursor-pointer transition-all text-sm font-medium ${
                    difficulty === d
                      ? "border-accent bg-accent/10 shadow-soft"
                      : "border-border bg-secondary/50 hover:border-accent/50"
                  }`}
                >
                  <RadioGroupItem id={`diff-${d}`} value={d} className="sr-only" />
                  {d}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <Button onClick={start} size="lg" className="w-full bg-teak-gradient h-12 text-base">
            Start game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
