import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createInitialState } from "@/game/engine";
import { getPlayerId, makeRoomCode } from "@/lib/playerId";
import { toast } from "sonner";

type Side = "goat" | "tiger" | "random";

export function InviteFriendDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"host" | "join">("host");
  const [side, setSide] = useState<Side>("goat");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const host = async () => {
    setBusy(true);
    try {
      const playerId = getPlayerId();
      const chosen: "goat" | "tiger" =
        side === "random" ? (Math.random() < 0.5 ? "goat" : "tiger") : side;
      const newCode = makeRoomCode();
      const { data, error } = await supabase
        .from("rooms")
        .insert([
          {
            code: newCode,
            host_id: playerId,
            host_side: chosen,
            state: JSON.parse(JSON.stringify(createInitialState())),
            status: "waiting",
          },
        ])
        .select()
        .single();
      if (error || !data) throw error ?? new Error("Could not create room");
      onOpenChange(false);
      navigate(`/room/${data.code}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create room";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      toast.error("Enter a 6-character room code");
      return;
    }
    setBusy(true);
    try {
      const playerId = getPlayerId();
      const { data, error } = await supabase.rpc("join_room", {
        p_code: trimmed,
        p_player_id: playerId,
      });
      if (error) throw error;
      if (!data) throw new Error("Room not found");
      onOpenChange(false);
      navigate(`/room/${trimmed}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not join room";
      toast.error(msg.includes("room_full") ? "Room is full" : msg.includes("room_not_found") ? "Room not found" : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Invite a Friend</DialogTitle>
          <DialogDescription>
            Host a room and share the code, or join your friend's room.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary/40 p-1 mt-2">
          <button
            onClick={() => setTab("host")}
            className={`h-10 rounded-lg text-sm font-medium transition-all ${
              tab === "host" ? "bg-card shadow-soft" : "text-muted-foreground"
            }`}
          >
            Host a room
          </button>
          <button
            onClick={() => setTab("join")}
            className={`h-10 rounded-lg text-sm font-medium transition-all ${
              tab === "join" ? "bg-card shadow-soft" : "text-muted-foreground"
            }`}
          >
            Join a room
          </button>
        </div>

        {tab === "host" ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Your side
              </Label>
              <RadioGroup
                value={side}
                onValueChange={(v) => setSide(v as Side)}
                className="grid grid-cols-3 gap-2"
              >
                {(
                  [
                    { id: "goat", label: "Goats", emoji: "🐐" },
                    { id: "tiger", label: "Tigers", emoji: "🐅" },
                    { id: "random", label: "Random", emoji: "🎲" },
                  ] as { id: Side; label: string; emoji: string }[]
                ).map((opt) => (
                  <Label
                    key={opt.id}
                    htmlFor={`hside-${opt.id}`}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                      side === opt.id
                        ? "border-accent bg-accent/10 shadow-soft"
                        : "border-border bg-secondary/50 hover:border-accent/50"
                    }`}
                  >
                    <RadioGroupItem id={`hside-${opt.id}`} value={opt.id} className="sr-only" />
                    <span className="text-2xl" aria-hidden>
                      {opt.emoji}
                    </span>
                    <span className="font-display text-sm">{opt.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <Button
              onClick={host}
              disabled={busy}
              size="lg"
              className="w-full bg-teak-gradient h-12 text-base"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create room"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="join-code" className="text-xs uppercase tracking-wider text-muted-foreground">
                Room code
              </Label>
              <Input
                id="join-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                className="h-12 text-center text-2xl tracking-[0.4em] font-mono"
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>
            <Button
              onClick={join}
              disabled={busy || code.trim().length !== 6}
              size="lg"
              className="w-full bg-teak-gradient h-12 text-base"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join room"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
