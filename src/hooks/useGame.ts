import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyMove,
  createInitialState,
  legalDestinations,
  legalMoves,
  type GameState,
  type Move,
  type Player,
} from "@/game/engine";
import { chooseAIMove, type Difficulty } from "@/game/ai";
import { sfx, vibrate } from "@/lib/sfx";
import type { NodeId } from "@/game/board";
import { planAnimation, type AnimationStep } from "@/animations/animationEngine";

const STORAGE_KEY = "apa.savegame.v1";

export type Mode = "vs-ai-tigers" | "vs-ai-goats" | "pass-and-play";

export interface GameSettings {
  mode: Mode;
  difficulty: Difficulty;
  showHints: boolean;
  showOverlay: boolean;
}

export interface UseGameReturn {
  state: GameState;
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  selected: NodeId | null;
  destinations: { to: NodeId; capture: boolean }[];
  hint: Move | null;
  isAIThinking: boolean;
  lastMove: Move | null;
  capturedAt: NodeId | null;            // node id where a capture flash should play
  animation: AnimationStep | null;      // visual replay descriptor for the latest move
  onNodeClick: (id: NodeId) => void;
  newGame: (mode?: Mode, difficulty?: Difficulty) => void;
  requestHint: () => void;
  undo: () => void;
  humanPlayer: Player | null;           // null = pass & play
}

function aiPlayerFor(mode: Mode): Player | null {
  if (mode === "vs-ai-tigers") return "tiger"; // AI plays tigers, human is goats
  if (mode === "vs-ai-goats") return "goat";   // AI plays goats, human is tigers
  return null;
}

function humanPlayerFor(mode: Mode): Player | null {
  if (mode === "vs-ai-tigers") return "goat";
  if (mode === "vs-ai-goats") return "tiger";
  return null;
}

export function useGame(initialMode: Mode = "vs-ai-tigers", initialDifficulty: Difficulty = "medium"): UseGameReturn {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [settings, setSettings] = useState<GameSettings>({
    mode: initialMode,
    difficulty: initialDifficulty,
    showHints: false,
    showOverlay: false,
  });
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [capturedAt, setCapturedAt] = useState<NodeId | null>(null);
  const [animation, setAnimation] = useState<AnimationStep | null>(null);
  const aiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydrated = useRef(false);

  // Load saved game once — only resume if it's a meaningful in-progress game,
  // and ask the player first instead of silently overwriting a fresh start.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { hasHydrated.current = true; return; }
      const saved = JSON.parse(raw) as { state: GameState; settings: GameSettings };
      const s = saved?.state;
      const inProgress =
        s?.cells?.length === 23 &&
        !s.winner &&
        s.phase !== "ended" &&
        (s.history?.length ?? 0) > 0;
      if (inProgress) {
        const resume = window.confirm("Resume your last game?");
        if (resume) {
          setState(saved.state);
          setSettings((cur) => ({ ...cur, ...saved.settings }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      /* ignore */
    } finally {
      hasHydrated.current = true;
    }
  }, []);

  // Persist (skip until hydration completes so we don't overwrite the saved
  // game with the fresh initial state during the first render).
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, settings }));
    } catch {
      /* ignore */
    }
  }, [state, settings]);

  const aiPlayer = aiPlayerFor(settings.mode);
  const humanPlayer = humanPlayerFor(settings.mode);

  const destinations = useMemo(
    () => (selected !== null ? legalDestinations(state, selected) : []),
    [selected, state],
  );

  const lastMove = state.history.length ? state.history[state.history.length - 1] : null;

  const performMove = useCallback((move: Move) => {
    // Plan visual replay BEFORE state mutates so the animation layer can paint
    // origin/destination/captured nodes in the correct frame.
    const step = planAnimation(move);
    setAnimation(step);
    if (step.capturedAt !== null) setCapturedAt(step.capturedAt);
    // Clear visual cues after the animation duration completes.
    window.setTimeout(() => {
      setAnimation((cur) => (cur && cur.id === step.id ? null : cur));
    }, step.durationMs + 80);
    if (step.capturedAt !== null) {
      window.setTimeout(() => setCapturedAt(null), step.durationMs + 80);
    }

    setState((prev) => {
      const next = applyMove(prev, move);
      if (move.kind === "capture") {
        sfx.capture();
        vibrate([15, 25, 30]);
      } else if (move.kind === "place") {
        sfx.place();
        vibrate(8);
      } else {
        sfx.move();
        vibrate(6);
      }
      if (next.winner) {
        if (humanPlayerFor(settings.mode) === next.winner) sfx.win();
        else if (humanPlayerFor(settings.mode)) sfx.lose();
        else sfx.win();
        vibrate([20, 40, 20, 40, 60]);
      }
      return next;
    });
    setSelected(null);
    setHint(null);
  }, [settings.mode]);

  // AI turn driver
  useEffect(() => {
    if (state.phase === "ended") return;
    if (!aiPlayer) return;
    if (state.turn !== aiPlayer) return;

    setIsAIThinking(true);
    aiTimeout.current = setTimeout(() => {
      const decision = chooseAIMove(state, aiPlayer, settings.difficulty);
      setIsAIThinking(false);
      if (decision) performMove(decision.move);
    }, 450);

    return () => {
      if (aiTimeout.current) clearTimeout(aiTimeout.current);
      setIsAIThinking(false);
    };
  }, [state, aiPlayer, settings.difficulty, performMove]);

  const onNodeClick = useCallback(
    (id: NodeId) => {
      if (state.phase === "ended") return;
      if (aiPlayer && state.turn === aiPlayer) return;        // not your turn
      if (isAIThinking) return;

      // Goat placement phase
      if (state.turn === "goat" && state.phase === "placement") {
        if (state.cells[id] !== "empty") return;
        performMove({ kind: "place", to: id });
        return;
      }

      // Movement / capture phase
      if (selected === null) {
        const ownPiece = state.turn === "goat" ? "goat" : "tiger";
        if (state.cells[id] === ownPiece) setSelected(id);
        return;
      }

      // already selected — clicking same piece deselects
      if (id === selected) {
        setSelected(null);
        return;
      }
      // clicking another own piece reselects
      const ownPiece = state.turn === "goat" ? "goat" : "tiger";
      if (state.cells[id] === ownPiece) {
        setSelected(id);
        return;
      }
      // attempt move
      const candidate = legalMoves(state).find((m) => {
        if (m.kind === "place") return false;
        return m.from === selected && m.to === id;
      });
      if (candidate) performMove(candidate);
    },
    [aiPlayer, isAIThinking, performMove, selected, state],
  );

  const newGame = useCallback((mode?: Mode, difficulty?: Difficulty) => {
    setState(createInitialState());
    setSelected(null);
    setHint(null);
    setCapturedAt(null);
    setSettings((s) => ({
      ...s,
      mode: mode ?? s.mode,
      difficulty: difficulty ?? s.difficulty,
    }));
  }, []);

  const requestHint = useCallback(() => {
    if (state.phase === "ended") return;
    const player: Player = state.turn;
    const decision = chooseAIMove(state, player, "hard");
    if (decision) setHint(decision.move);
  }, [state]);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) return prev;
      // Re-derive by replaying minus 1 (or 2, to skip past AI move)
      const ai = aiPlayerFor(settings.mode);
      const stepsBack = ai && prev.history.length >= 2 ? 2 : 1;
      let next = createInitialState();
      const replay = prev.history.slice(0, prev.history.length - stepsBack);
      for (const m of replay) next = applyMove(next, m);
      return next;
    });
    setSelected(null);
    setHint(null);
  }, [settings.mode]);

  return {
    state,
    settings,
    setSettings,
    selected,
    destinations,
    hint,
    isAIThinking,
    lastMove,
    capturedAt,
    animation,
    onNodeClick,
    newGame,
    requestHint,
    undo,
    humanPlayer,
  };
}
