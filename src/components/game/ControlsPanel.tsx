import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lightbulb, Eye, Undo2, RotateCcw, Share2 } from "lucide-react";
import type { Difficulty } from "@/game/ai";
import type { GameSettings, Mode } from "@/hooks/useGame";
import type { Move } from "@/game/engine";
import { shareUrl } from "@/game/share";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ControlsPanelProps {
  settings: GameSettings;
  onChange: (s: GameSettings) => void;
  onHint: () => void;
  onUndo: () => void;
  onNewGame: () => void;
  canUndo: boolean;
  history: Move[];
}

export function ControlsPanel({ settings, onChange, onHint, onUndo, onNewGame, canUndo, history }: ControlsPanelProps) {
  const set = <K extends keyof GameSettings>(k: K, v: GameSettings[K]) => onChange({ ...settings, [k]: v });

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
    <Card className="p-4 shadow-soft bg-card/80 backdrop-blur-sm space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mode</Label>
          <Select value={settings.mode} onValueChange={(v) => set("mode", v as Mode)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vs-ai-tigers">Play as Goats vs AI</SelectItem>
              <SelectItem value="vs-ai-goats">Play as Tigers vs AI</SelectItem>
              <SelectItem value="pass-and-play">Pass &amp; Play</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Difficulty</Label>
          <Select value={settings.difficulty} onValueChange={(v) => set("difficulty", v as Difficulty)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md bg-secondary/60 px-3 py-2">
        <Label htmlFor="hints" className="flex items-center gap-2 text-sm cursor-pointer">
          <Lightbulb className="h-4 w-4 text-accent" /> Move hints
        </Label>
        <Switch id="hints" checked={settings.showHints} onCheckedChange={(v) => set("showHints", v)} />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md bg-secondary/60 px-3 py-2">
        <Label htmlFor="overlay" className="flex items-center gap-2 text-sm cursor-pointer">
          <Eye className="h-4 w-4 text-accent" /> Strategy overlay
        </Label>
        <Switch id="overlay" checked={settings.showOverlay} onCheckedChange={(v) => set("showOverlay", v)} />
      </div>

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
