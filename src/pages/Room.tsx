import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Board } from "@/components/game/Board";
import { GameOverDialog } from "@/components/game/GameOverDialog";
import { MuteToggle } from "@/components/game/MuteToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, Loader2, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPlayerId } from "@/lib/playerId";
import {
  applyMove,
  createInitialState,
  legalDestinations,
  legalMoves,
  type GameState,
  type Move,
  type Player,
} from "@/game/engine";
import { sfx, vibrate } from "@/lib/sfx";
import type { NodeId } from "@/game/board";
import { toast } from "sonner";

interface Room {
  id: string;
  code: string;
  host_id: string;
  guest_id: string | null;
  host_side: "goat" | "tiger";
  state: GameState;
  status: "waiting" | "playing" | "ended";
}

const Room = () => {
  const { code: codeParam } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const code = (codeParam ?? "").toUpperCase();
  const playerId = useRef(getPlayerId()).current;

  const [room, setRoom] = useState<Room | null>(null);
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [capturedAt, setCapturedAt] = useState<NodeId | null>(null);
  const [copied, setCopied] = useState(false);
  const [overOpen, setOverOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial fetch + auto-join (covers the case where guest opened the share link directly)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("join_room", {
          p_code: code,
          p_player_id: playerId,
        });
        if (cancelled) return;
        if (error) {
          const msg = error.message.includes("room_full")
            ? "Room is full"
            : error.message.includes("room_not_found")
              ? "Room not found"
              : error.message;
          toast.error(msg);
          navigate("/");
          return;
        }
        setRoom(data as unknown as Room);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, playerId, navigate]);

  // Realtime subscription
  useEffect(() => {
    if (!room?.id) return;
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          const next = payload.new as unknown as Room;
          setRoom((prev) => {
            if (!prev) return next;
            // Capture flash if a capture just happened
            const prevHist = prev.state.history.length;
            const nextHist = next.state.history.length;
            if (nextHist > prevHist) {
              const last = next.state.history[nextHist - 1];
              if (last.kind === "capture") {
                setCapturedAt(last.over);
                setTimeout(() => setCapturedAt(null), 600);
                sfx.capture();
                vibrate([15, 25, 30]);
              } else if (last.kind === "place") {
                sfx.place();
              } else {
                sfx.move();
              }
            }
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  const mySide: Player | null = useMemo(() => {
    if (!room) return null;
    if (room.host_id === playerId) return room.host_side;
    if (room.guest_id === playerId) return room.host_side === "goat" ? "tiger" : "goat";
    return null;
  }, [room, playerId]);

  const myTurn = !!room && mySide !== null && room.state.turn === mySide && room.status === "playing";

  const destinations = useMemo(
    () => (selected !== null && room ? legalDestinations(room.state, selected) : []),
    [selected, room],
  );

  const lastMove = room?.state.history.length
    ? room.state.history[room.state.history.length - 1]
    : null;

  useEffect(() => {
    if (room?.state.winner) setOverOpen(true);
  }, [room?.state.winner]);

  const pushMove = useCallback(
    async (move: Move) => {
      if (!room) return;
      const next = applyMove(room.state, move);
      // Optimistic local update
      setRoom({ ...room, state: next });
      setSelected(null);
      try {
        const { error } = await supabase.rpc("apply_room_state", {
          p_room_id: room.id,
          p_player_id: playerId,
          p_state: JSON.parse(JSON.stringify(next)),
          p_status: next.winner ? "ended" : "playing",
        });
        if (error) throw error;
      } catch (e) {
        toast.error("Could not sync move — reverting");
        setRoom(room); // revert
      }
    },
    [room, playerId],
  );

  const onNodeClick = useCallback(
    (id: NodeId) => {
      if (!room || !mySide) return;
      if (room.state.phase === "ended") return;
      if (!myTurn) return;

      // Goat placement
      if (room.state.turn === "goat" && room.state.phase === "placement") {
        if (room.state.cells[id] !== "empty") return;
        pushMove({ kind: "place", to: id });
        return;
      }
      // Movement
      if (selected === null) {
        const ownPiece = mySide;
        if (room.state.cells[id] === ownPiece) setSelected(id);
        return;
      }
      if (id === selected) {
        setSelected(null);
        return;
      }
      const ownPiece = mySide;
      if (room.state.cells[id] === ownPiece) {
        setSelected(id);
        return;
      }
      const candidate = legalMoves(room.state).find((m) => {
        if (m.kind === "place") return false;
        return m.from === selected && m.to === id;
      });
      if (candidate) pushMove(candidate);
    },
    [room, mySide, myTurn, selected, pushMove],
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/room/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Aadu Puli Attam", text: `Join my game! Code: ${code}`, url });
      } catch {
        /* noop */
      }
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  if (!room || !mySide) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground">Room unavailable.</p>
        <Button asChild>
          <Link to="/">Back home</Link>
        </Button>
      </main>
    );
  }

  const waiting = room.status === "waiting";
  const opponentLabel = mySide === "goat" ? "Tigers" : "Goats";
  const turnLabel = room.state.turn === mySide ? "Your turn" : `Waiting for ${opponentLabel}…`;

  return (
    <main className="min-h-screen px-4 sm:px-6 py-4 sm:py-6">
      <header className="max-w-3xl mx-auto flex items-center justify-between gap-3 mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </Button>
        <h1 className="font-display text-xl sm:text-2xl text-saffron">Room {code}</h1>
        <MuteToggle />
      </header>

      <section className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-2xl border-2 border-border bg-card/60 p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">You play</p>
            <p className="font-display text-lg">
              {mySide === "goat" ? "🐐 Goats" : "🐅 Tigers"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
            <p className="font-medium">
              {waiting ? "Waiting for opponent…" : room.status === "ended" ? "Game over" : turnLabel}
            </p>
          </div>
        </div>

        {waiting && (
          <div className="rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-4 space-y-3">
            <p className="text-sm">
              Share this code with your friend. They can enter it on the home screen, or open the
              link directly.
            </p>
            <div className="rounded-xl bg-background/80 border-2 border-border p-3 text-center font-mono text-3xl tracking-[0.4em]">
              {code}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copyLink} variant="outline" className="h-11 gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button onClick={shareLink} className="h-11 bg-teak-gradient gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>
        )}

        <Board
          state={room.state}
          selected={selected}
          destinations={destinations}
          hint={null}
          showHints={false}
          showOverlay={false}
          capturedAt={capturedAt}
          lastMove={lastMove}
          onNodeClick={onNodeClick}
        />
        <p className="text-center text-xs text-muted-foreground px-4">
          Goats captured: {room.state.goatsCaptured} · Goats placed: {room.state.goatsPlaced}/15
        </p>
      </section>

      <GameOverDialog
        winner={room.state.winner}
        open={overOpen}
        onOpenChange={setOverOpen}
        onNewGame={() => navigate("/")}
      />
    </main>
  );
};

export default Room;
