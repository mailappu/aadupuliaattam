import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Eye, Lightbulb } from "lucide-react";
import type { GameSettings, Mode } from "@/hooks/useGame";
import type { Difficulty } from "@/game/ai";

interface SettingsDialogProps {
  settings: GameSettings;
  onChange: (s: GameSettings) => void;
}

export function SettingsDialog({ settings, onChange }: SettingsDialogProps) {
  const set = <K extends keyof GameSettings>(k: K, v: GameSettings[K]) =>
    onChange({ ...settings, [k]: v });
  const isAI = settings.mode !== "pass-and-play";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-saffron">Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isAI && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Difficulty
              </Label>
              <Select
                value={settings.difficulty}
                onValueChange={(v) => set("difficulty", v as Difficulty)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 rounded-md bg-secondary/60 px-3 py-2">
            <Label htmlFor="s-hints" className="flex items-center gap-2 text-sm cursor-pointer">
              <Lightbulb className="h-4 w-4 text-accent" /> Move hints
            </Label>
            <Switch
              id="s-hints"
              checked={settings.showHints}
              onCheckedChange={(v) => set("showHints", v)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md bg-secondary/60 px-3 py-2">
            <Label htmlFor="s-overlay" className="flex items-center gap-2 text-sm cursor-pointer">
              <Eye className="h-4 w-4 text-accent" /> Strategy overlay
            </Label>
            <Switch
              id="s-overlay"
              checked={settings.showOverlay}
              onCheckedChange={(v) => set("showOverlay", v)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
