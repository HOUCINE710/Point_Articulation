export interface Node {
  id: number;
  x: number;
  y: number;
  energy: number;     // 0-100 percentage
  maxEnergy: number;  // For calculating ratio
  range: number;      // Detection radius in pixels
  status: 'active' | 'sleeping' | 'dead';
}

export interface Link {
  source: number;
  target: number;
  type?: 'tree' | 'back' | 'normal' | 'reinforce'; 
}

export interface DfsState {
  discoveryTime: Record<number, number>;
  lowLink: Record<number, number>;
  parents: Record<number, number | null>;
  visited: Set<number>;
  articulationPoints: Set<number>;
  colors: Record<number, 'white' | 'gray' | 'black' | 'red'>;
}

export interface AlgorithmStep {
  stepId: number;
  description: string;
  codeLine: number;
  highlightNode: number | null;
  highlightNeighbor: number | null;
  state: DfsState;
  explanationType: 'info' | 'update' | 'found-ap' | 'back-edge' | 'sleeping-wake';
}

export interface SimulationConfig {
  nodeCount: number;
  width: number;
  height: number;
  speed: number;
}