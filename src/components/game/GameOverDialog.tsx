import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Winner } from "@/game/engine";

export function GameOverDialog({
  winner,
  onNewGame,
  open,
  onOpenChange,
}: {
  winner: Winner;
  onNewGame: () => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!winner) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">
            {winner === "tiger" ? "🐅 Tigers Win" : "🐐 Goats Win"}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {winner === "tiger"
              ? "The tigers feasted — five goats captured. The hunt is over."
              : "The herd held its ground — every tiger is cornered."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Review board</Button>
          <Button onClick={onNewGame} className="bg-teak-gradient">Play again</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
