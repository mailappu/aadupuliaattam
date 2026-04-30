import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Undo2, RotateCcw, Share2 } from "lucide-react";
import type { GameSettings } from "@/hooks/useGame";
import type { Move } from "@/game/engine";
import { shareUrl } from "@/game/share";
import { toast } from "@/hooks/use-toast";

interface ControlsPanelProps {
  settings: GameSettings;
  onChange: (s: GameSettings) => void;
  onHint: () => void;
  onUndo: () => void;
  onNewGame: () => void;
  canUndo: boolean;
  history: Move[];
}

export function ControlsPanel({ onHint, onUndo, onNewGame, canUndo, history }: ControlsPanelProps) {
  const onShare = async () => {
    if (history.length === 0) {
      toast({ title: "Nothing to share yet", description: "Make a move first." });
      return;
    }
    const url = shareUrl(history);
    try {
      const nav = navigator as Navigator & { share?: (d: { url: string; title?: string }) => Promise<void> };
      if (nav.share) {
        await nav.share({ url, title: "My Aadu Puli Attam game" });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Replay link copied", description: "Paste it anywhere to share." });
      }
    } catch {
      // user cancelled share — silent
    }
  };

  return (
    <Card className="p-4 shadow-soft bg-card/80 backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={onHint} className="gap-1.5">
          <Lightbulb className="h-4 w-4" /> Hint
        </Button>
        <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo} className="gap-1.5">
          <Undo2 className="h-4 w-4" /> Undo
        </Button>
        <Button variant="outline" size="sm" onClick={onShare} className="gap-1.5">
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button variant="default" size="sm" onClick={onNewGame} className="gap-1.5 bg-teak-gradient">
          <RotateCcw className="h-4 w-4" /> New
        </Button>
      </div>
    </Card>
  );
}
