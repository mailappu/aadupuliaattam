import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";

type Side = "goat" | "tiger" | "random";

export function PassAndPlayDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");
  const [p1Side, setP1Side] = useState<Side>("goat");

  const start = () => {
    const chosen: "goat" | "tiger" =
      p1Side === "random" ? (Math.random() < 0.5 ? "goat" : "tiger") : p1Side;
    const params = new URLSearchParams({
      mode: "pass-and-play",
      p1: p1Name.trim() || "Player 1",
      p2: p2Name.trim() || "Player 2",
      p1side: chosen,
    });
    onOpenChange(false);
    navigate(`/play?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Pass &amp; Play</DialogTitle>
          <DialogDescription>
            Two players, one device. Choose who plays which side. Goats always begin
            (placement phase) per the traditional rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p1" className="text-xs uppercase tracking-wider text-muted-foreground">
                Player 1
              </Label>
              <Input id="p1" value={p1Name} onChange={(e) => setP1Name(e.target.value.slice(0, 20))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p2" className="text-xs uppercase tracking-wider text-muted-foreground">
                Player 2
              </Label>
              <Input id="p2" value={p2Name} onChange={(e) => setP2Name(e.target.value.slice(0, 20))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {p1Name || "Player 1"} plays
            </Label>
            <RadioGroup
              value={p1Side}
              onValueChange={(v) => setP1Side(v as Side)}
              className="grid grid-cols-3 gap-2"
            >
              {(
                [
                  { id: "goat", label: "Goats", emoji: "🐐", sub: "15 pieces" },
                  { id: "tiger", label: "Tigers", emoji: "🐅", sub: "3 pieces" },
                  { id: "random", label: "Random", emoji: "🎲", sub: "Surprise me" },
                ] as { id: Side; label: string; emoji: string; sub: string }[]
              ).map((opt) => (
                <Label
                  key={opt.id}
                  htmlFor={`pp-side-${opt.id}`}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                    p1Side === opt.id
                      ? "border-accent bg-accent/10 shadow-soft"
                      : "border-border bg-secondary/50 hover:border-accent/50"
                  }`}
                >
                  <RadioGroupItem id={`pp-side-${opt.id}`} value={opt.id} className="sr-only" />
                  <span className="text-3xl" aria-hidden>
                    {opt.emoji}
                  </span>
                  <span className="font-display text-base">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.sub}</span>
                </Label>
              ))}
            </RadioGroup>
            <p className="text-[11px] text-muted-foreground pt-1">
              {p2Name || "Player 2"} will play{" "}
              <span className="font-medium">
                {p1Side === "goat" ? "Tigers" : p1Side === "tiger" ? "Goats" : "the other side"}
              </span>
              .
            </p>
          </div>

          <Button onClick={start} size="lg" className="w-full bg-teak-gradient h-12 text-base">
            Start game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
