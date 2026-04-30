import { describe, it, expect } from "vitest";
import { ADJACENCY, JUMPS, NODES, STARTING_TIGERS, TOTAL_NODES } from "@/game/board";
import {
  applyMove,
  createInitialState,
  legalMoves,
  tigerPositions,
  goatPositions,
} from "@/game/engine";

describe("board topology", () => {
  it("has 23 nodes", () => {
    expect(TOTAL_NODES).toBe(23);
    expect(NODES.length).toBe(23);
  });
  it("adjacency is symmetric", () => {
    for (let i = 0; i < TOTAL_NODES; i++) {
      for (const n of ADJACENCY[i]) {
        expect(ADJACENCY[n]).toContain(i);
      }
    }
  });
  it("every jump has matching adjacency edges", () => {
    for (let i = 0; i < TOTAL_NODES; i++) {
      for (const j of JUMPS[i]) {
        expect(ADJACENCY[i]).toContain(j.over);
        expect(ADJACENCY[j.over]).toContain(j.land);
      }
    }
  });
});

describe("engine", () => {
  it("starts with 3 tigers and 0 goats, goat to move", () => {
    const s = createInitialState();
    expect(tigerPositions(s)).toEqual(STARTING_TIGERS);
    expect(goatPositions(s).length).toBe(0);
    expect(s.turn).toBe("goat");
    expect(s.phase).toBe("placement");
  });

  it("goat placement alternates with tiger movement", () => {
    let s = createInitialState();
    const place = legalMoves(s).find((m) => m.kind === "place" && m.to === 9)!;
    s = applyMove(s, place);
    expect(s.turn).toBe("tiger");
    const tigerMoves = legalMoves(s);
    expect(tigerMoves.every((m) => m.kind === "move" || m.kind === "capture")).toBe(true);
  });

  it("rejects placement on occupied cell", () => {
    const s = createInitialState();
    expect(() => applyMove(s, { kind: "place", to: STARTING_TIGERS[0] })).toThrow();
  });
});
