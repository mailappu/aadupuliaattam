import { describe, it, expect } from "vitest";
import {
  applyMove,
  createInitialState,
  getPhase,
  getValidMoves,
  isGameOver,
  legalMoves,
} from "@/game/engine";
import { ADJACENCY } from "@/game/board";

describe("state-machine guards", () => {
  it("getPhase reports placement at start, movement after 15 placements", () => {
    let s = createInitialState();
    expect(getPhase(s)).toBe("placement");

    // Alternate goat placement / tiger slide until 15 goats are placed.
    while (s.goatsPlaced < 15 && !isGameOver(s)) {
      const moves = legalMoves(s);
      expect(moves.length).toBeGreaterThan(0);
      // pick the first non-capture move so this test stays focused on phases
      const m = moves.find((x) => x.kind !== "capture") ?? moves[0];
      s = applyMove(s, m);
    }
    expect(getPhase(s)).toBe("movement");
  });

  it("rejects a goat slide attempt during placement phase", () => {
    const s = createInitialState();
    // goat doesn't even own a piece on the board yet — engine must reject
    expect(() =>
      applyMove(s, { kind: "move", from: 9, to: 10 }),
    ).toThrow();
  });

  it("rejects sliding to a non-adjacent node", () => {
    // Put a tiger somewhere with a clear non-neighbor and try to teleport.
    const s = createInitialState();
    const tigerNode = s.cells.findIndex((c) => c === "tiger");
    const neighbors = ADJACENCY[tigerNode];
    const farNode = s.cells.findIndex(
      (c, i) => c === "empty" && !neighbors.includes(i) && i !== tigerNode,
    );
    expect(() =>
      // Force-set turn to tiger via a goat placement first
      applyMove(applyMove(s, { kind: "place", to: 9 }), {
        kind: "move",
        from: tigerNode,
        to: farNode,
      }),
    ).toThrow();
  });

  it("getValidMoves filters by player", () => {
    const s = createInitialState();
    expect(getValidMoves(s, "goat").length).toBeGreaterThan(0);
    expect(getValidMoves(s, "tiger").length).toBe(0);
  });

  it("isGameOver false at start", () => {
    expect(isGameOver(createInitialState())).toBe(false);
  });
});
