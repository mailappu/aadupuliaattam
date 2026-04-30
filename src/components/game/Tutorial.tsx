import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to Aadu Puli Attam",
    body: "An ancient South Indian strategy game played between 3 tigers (🐅) and 15 goats (🐐). Tigers try to capture goats; goats try to corner the tigers.",
  },
  {
    title: "Phase 1 — Placement",
    body: "The goat player goes first, placing one goat at a time on any empty intersection. Tigers move (or jump) between placements.",
  },
  {
    title: "Tiger movement",
    body: "Tigers slide along any line to an adjacent empty point — or jump over an adjacent goat to the empty point directly beyond it (along a straight board line). Each jump captures that goat.",
  },
  {
    title: "Goat movement",
    body: "Once all 15 goats are placed, goats can also slide to adjacent empty points. Goats never jump or capture.",
  },
  {
    title: "How to win",
    body: "Tigers win by capturing 5 goats. Goats win by trapping every tiger so it has no legal moves. Use the Hint button anytime — and toggle the Strategy overlay to see threats.",
  },
];

export function Tutorial({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setI(0); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-2">{step.body}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 w-6 rounded-full transition-colors ${idx === i ? "bg-accent" : "bg-muted"}`}
              />
            ))}
          </div>
          {last ? (
            <Button size="sm" onClick={() => onOpenChange(false)} className="bg-teak-gradient">
              Start playing
            </Button>
          ) : (
            <Button size="sm" onClick={() => setI((x) => Math.min(STEPS.length - 1, x + 1))} className="bg-teak-gradient">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
