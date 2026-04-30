// Aadu Puli Attam — Board topology (23 nodes).
// Coordinate system: SVG viewBox 0..100 x 0..110.
// Layout: a top triangle (apex + 2 tips) sitting on a 5x4 grid of nodes.
//
// Node indices (0-based, 23 total):
//   0                  apex
//   1, 2               upper triangle tips (left, right of apex below)
//   3..7               row 1 (5 nodes)
//   8..12              row 2 (5 nodes)
//   13..17             row 3 (5 nodes)
//   18..22             row 4 (5 nodes)
//
// Adjacencies follow the printed board lines (horizontals across each row,
// verticals down columns, diagonals from apex/tips into the grid, and the
// diagonal cross-lines on the central rows, which is what enables tiger jumps).

export type NodeId = number;

export interface BoardNode {
  id: NodeId;
  x: number;
  y: number;
}

// Geometry — designed to look like a temple-ish board.
const APEX: [number, number] = [50, 6];
const TIP_L: [number, number] = [30, 22];
const TIP_R: [number, number] = [70, 22];

// Grid rows: y positions
const ROW_Y = [38, 58, 78, 98];
const COL_X = [10, 30, 50, 70, 90];

const gridNode = (row: number, col: number): [number, number] => [COL_X[col], ROW_Y[row]];

export const NODES: BoardNode[] = [
  { id: 0, x: APEX[0], y: APEX[1] },
  { id: 1, x: TIP_L[0], y: TIP_L[1] },
  { id: 2, x: TIP_R[0], y: TIP_R[1] },
  ...Array.from({ length: 4 }).flatMap((_, r) =>
    Array.from({ length: 5 }).map((_, c) => {
      const [x, y] = gridNode(r, c);
      return { id: 3 + r * 5 + c, x, y };
    }),
  ),
];

// Helper to compute grid index
const g = (row: number, col: number): NodeId => 3 + row * 5 + col;

// Build adjacency list from explicit edges (undirected).
const EDGES: Array<[NodeId, NodeId]> = [
  // Apex connects down to the two tips and to row1 center
  [0, 1],
  [0, 2],
  [0, g(0, 2)],
  // Tips connect into row 1
  [1, g(0, 0)],
  [1, g(0, 1)],
  [1, g(0, 2)],
  [2, g(0, 2)],
  [2, g(0, 3)],
  [2, g(0, 4)],
  // Tips connect to each other (horizontal across triangle)
  [1, 2],
];

// Horizontals on each row
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 4; c++) EDGES.push([g(r, c), g(r, c + 1)]);
}
// Verticals on each column
for (let c = 0; c < 5; c++) {
  for (let r = 0; r < 3; r++) EDGES.push([g(r, c), g(r + 1, c)]);
}
// Diagonals — only on cells where the printed board has the X cross.
// In the standard board, diagonals exist on cells whose top-left has (r+c) even.
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 4; c++) {
    if ((r + c) % 2 === 0) {
      EDGES.push([g(r, c), g(r + 1, c + 1)]);
      EDGES.push([g(r, c + 1), g(r + 1, c)]);
    }
  }
}

export const ADJACENCY: NodeId[][] = NODES.map(() => []);
for (const [a, b] of EDGES) {
  if (!ADJACENCY[a].includes(b)) ADJACENCY[a].push(b);
  if (!ADJACENCY[b].includes(a)) ADJACENCY[b].push(a);
}

/**
 * Jump map: for each node A, for each neighbor B, what node C is the
 * "straight-line continuation" past B? This defines tiger captures: tiger at A
 * jumps over goat at B, landing on C, but only if A-B-C are collinear AND
 * B-C is also an edge in the adjacency graph (i.e. the line continues).
 */
export interface JumpInfo {
  over: NodeId;     // the middle node (must contain a goat)
  land: NodeId;     // the landing node (must be empty)
}

const COLLINEAR_EPS = 0.01;

function isCollinear(a: BoardNode, b: BoardNode, c: BoardNode): boolean {
  // Cross product of (b-a) x (c-b) ~ 0
  const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
  // Also ensure C is on the *far* side of B (same direction as A->B)
  const dot = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y);
  return Math.abs(cross) < 5 && dot > COLLINEAR_EPS;
}

export const JUMPS: Record<NodeId, JumpInfo[]> = {};
for (const node of NODES) {
  JUMPS[node.id] = [];
  for (const mid of ADJACENCY[node.id]) {
    for (const land of ADJACENCY[mid]) {
      if (land === node.id) continue;
      if (isCollinear(NODES[node.id], NODES[mid], NODES[land])) {
        JUMPS[node.id].push({ over: mid, land });
      }
    }
  }
}

export const TOTAL_NODES = NODES.length;
export const STARTING_TIGERS: NodeId[] = [0, 1, 2];
export const TOTAL_GOATS_TO_PLACE = 15;
