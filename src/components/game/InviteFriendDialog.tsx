import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";

export function InviteFriendDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/play?mode=pass-and-play` : "/play";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Construction className="h-5 w-5 text-accent" /> Invite a Friend
          </DialogTitle>
          <DialogDescription className="pt-2">
            Online multiplayer is coming soon. For now you can share the game link and
            play together by passing one device — or share a finished game's replay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="rounded-xl border-2 border-border bg-secondary/40 p-3 break-all text-sm font-mono">
            {link}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={copy} variant="outline" className="h-11">
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <Button asChild className="h-11 bg-teak-gradient" onClick={() => onOpenChange(false)}>
              <Link to="/play?mode=pass-and-play">Open Pass &amp; Play</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
