export interface Node {
  id: number;
  x: number;
  y: number;
}

export interface Link {
  source: number;
  target: number;
  type?: 'tree' | 'back' | 'normal'; // For visualization
}

export interface DfsState {
  discoveryTime: Record<number, number>;
  lowLink: Record<number, number>;
  parents: Record<number, number | null>;
  visited: Set<number>;
  articulationPoints: Set<number>;
  colors: Record<number, 'white' | 'gray' | 'black' | 'red'>; // white: unvisited, gray: processing, black: finished, red: AP
}

export interface AlgorithmStep {
  stepId: number;
  description: string;
  codeLine: number; // 1-based index for pseudocode
  highlightNode: number | null; // Current node u
  highlightNeighbor: number | null; // Neighbor v
  state: DfsState;
  explanationType: 'info' | 'update' | 'found-ap' | 'back-edge';
}

export interface SimulationConfig {
  nodeCount: number;
  width: number;
  height: number;
  speed: number;
}
