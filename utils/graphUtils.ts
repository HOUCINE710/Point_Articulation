
import { Node, Link, AlgorithmStep, DfsState } from '../types';
import { SENSOR_CONFIG } from '../constants';
import * as d3 from 'd3';

export const getDistance = (n1: Node, n2: Node) => 
  Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));

const createNode = (id: number, x: number, y: number, status: Node['status'] = 'active'): Node => ({
  id, x, y,
  energy: SENSOR_CONFIG.defaultEnergy,
  maxEnergy: SENSOR_CONFIG.defaultEnergy,
  range: SENSOR_CONFIG.defaultRange,
  status: status
});

/**
 * Spawns sleeping nodes specifically near discovered Articulation Points.
 */
export const spawnSleepingNodesForAPs = (nodes: Node[], apIds: Set<number>): Node[] => {
  const newNodes = [...nodes];
  let maxId = nodes.reduce((max, n) => Math.max(max, n.id), 0);

  apIds.forEach(apId => {
    const apNode = nodes.find(n => n.id === apId);
    if (apNode) {
      maxId++;
      // Place sleeping node slightly offset
      newNodes.push(createNode(maxId, apNode.x + 30, apNode.y + 30, 'sleeping'));
    }
  });

  return newNodes;
};

/**
 * Recalculates links based on physical proximity (Range)
 * This makes the graph dynamic: if a node wakes up, it connects to everything in range.
 */
export const recalculateLinksBasedOnRange = (nodes: Node[]): Link[] => {
  const links: Link[] = [];
  const activeNodes = nodes.filter(n => n.status === 'active');

  for (let i = 0; i < activeNodes.length; i++) {
    for (let j = i + 1; j < activeNodes.length; j++) {
      const n1 = activeNodes[i];
      const n2 = activeNodes[j];
      const dist = getDistance(n1, n2);
      
      // Connection criteria: Distance < Min(Range1, Range2)
      if (dist <= Math.min(n1.range, n2.range)) {
        links.push({ source: n1.id, target: n2.id });
      }
    }
  }
  return links;
};

/**
 * Calculates node positions using D3 Force Simulation
 */
export const computeForceLayout = (rawNodes: {id: number}[], rawLinks: {source: number, target: number}[], width: number, height: number): { nodes: Node[], links: Link[] } => {
  const simNodes = rawNodes.map(n => ({ id: n.id, x: width/2, y: height/2 }));
  const simLinks = rawLinks.map(l => ({ source: l.source, target: l.target }));

  const simulation = d3.forceSimulation(simNodes as any)
    .force("link", d3.forceLink(simLinks).id((d: any) => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(60));

  simulation.tick(300);

  const finalNodes: Node[] = simNodes.map((n: any) => 
    createNode(n.id, Math.max(50, Math.min(width - 50, n.x)), Math.max(50, Math.min(height - 50, n.y)))
  );

  const finalLinks: Link[] = simLinks.map((l: any) => ({
    source: typeof l.source === 'object' ? l.source.id : l.source,
    target: typeof l.target === 'object' ? l.target.id : l.target
  }));

  return { nodes: finalNodes, links: finalLinks };
};

export const parseUploadedGraph = (content: string, type: 'json' | 'txt'): { nodes: {id: number}[], links: {source: number, target: number}[] } => {
  let rawLinks: {source: number, target: number}[] = [];
  
  if (type === 'json') {
    try {
      const data = JSON.parse(content);
      const linkArray = Array.isArray(data) ? data : (data.links || []);
      rawLinks = linkArray.map((l: any) => ({
        source: Number(l.source),
        target: Number(l.target)
      }));
    } catch (e) {
      throw new Error("Invalid JSON");
    }
  } else {
    const lines = content.trim().split(/\r?\n/);
    lines.forEach(line => {
      const parts = line.trim().split(/[\s,]+/);
      if (parts.length >= 2) {
        rawLinks.push({
          source: Number(parts[0]),
          target: Number(parts[1])
        });
      }
    });
  }

  const nodeSet = new Set<number>();
  rawLinks.forEach(l => {
    nodeSet.add(l.source);
    nodeSet.add(l.target);
  });
  
  const nodes = Array.from(nodeSet).sort((a, b) => a - b).map(id => ({ id }));
  
  if (nodes.length === 0) {
    throw new Error("No valid nodes found in file");
  }

  return { nodes, links: rawLinks };
};

/**
 * Generates the butterfly/demo topology WITHOUT default sleepers
 */
export const generateScenario = (width: number, height: number): { nodes: Node[], links: Link[] } => {
  const cx = width / 2;
  const cy = height / 2;
  
  // Standard Nodes
  const nodes: Node[] = [
    createNode(0, cx, cy),
    createNode(1, cx - 120, cy - 100),
    createNode(2, cx - 120, cy + 100),
    createNode(3, cx - 220, cy),
    createNode(4, cx + 120, cy - 100),
    createNode(5, cx + 120, cy + 100),
    createNode(6, cx + 220, cy),
    createNode(7, cx, cy - 180),
  ];

  // We do NOT add sleeping nodes here anymore. 
  // They are added only when Simulation starts based on AP detection.

  const links = recalculateLinksBasedOnRange(nodes);

  return { nodes, links };
};

export const calculateFixes = (nodes: Node[], links: Link[], aps: Set<number>): Link[] => {
  const newLinks: Link[] = [];
  const existingLinks = new Set<string>();

  const linkId = (u: number, v: number) => u < v ? `${u}-${v}` : `${v}-${u}`;
  links.forEach(l => {
      const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
      existingLinks.add(linkId(s, t));
  });

  const adj = new Map<number, number[]>();
  nodes.forEach(n => {
      if (n.status === 'active') adj.set(n.id, []);
  });
  
  links.forEach(l => {
     const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
     const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
     if (adj.has(s) && adj.has(t)) {
        adj.get(s)?.push(t);
        adj.get(t)?.push(s);
     }
  });

  aps.forEach(apId => {
      const neighbors = adj.get(apId) || [];
      if (neighbors.length >= 2) {
          for (let i = 0; i < neighbors.length - 1; i++) {
              const u = neighbors[i];
              const v = neighbors[i+1];
              if (!existingLinks.has(linkId(u, v))) {
                   newLinks.push({ source: u, target: v, type: 'reinforce' });
                   existingLinks.add(linkId(u, v));
              }
          }
      }
  });

  return newLinks;
};

export const generateDfsSteps = (nodes: Node[], links: Link[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const adj = new Map<number, number[]>();
  
  nodes.forEach(n => {
      if (n.status === 'active') adj.set(n.id, []);
  });

  links.forEach(l => {
    const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
    const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
    
    if (adj.has(s) && adj.has(t)) {
        adj.get(s)?.push(t);
        adj.get(t)?.push(s);
    }
  });

  const activeNodes = nodes.filter(n => n.status === 'active');
  if (activeNodes.length === 0) {
      steps.push({
          stepId: 0, codeLine: 0, description: "No active nodes.", highlightNode: null, highlightNeighbor: null,
          state: {
            discoveryTime: {}, lowLink: {}, parents: {}, visited: new Set(), articulationPoints: new Set(), colors: {}
          },
          explanationType: 'info'
      });
      return steps;
  }

  nodes.forEach(n => {
    adj.get(n.id)?.sort((a, b) => a - b);
  });

  let time = 0;
  const disc: Record<number, number> = {};
  const low: Record<number, number> = {};
  const parent: Record<number, number | null> = {};
  const visited = new Set<number>();
  const aps = new Set<number>();
  const colors: Record<number, 'white' | 'gray' | 'black' | 'red'> = {};

  nodes.forEach(n => { if(n.status === 'active') colors[n.id] = 'white'; });

  const pushStep = (line: number, desc: string, u: number | null, v: number | null, type: AlgorithmStep['explanationType'] = 'info') => {
    steps.push({
      stepId: steps.length,
      codeLine: line,
      description: desc,
      highlightNode: u,
      highlightNeighbor: v,
      explanationType: type,
      state: {
        discoveryTime: { ...disc },
        lowLink: { ...low },
        parents: { ...parent },
        visited: new Set(visited),
        articulationPoints: new Set(aps),
        colors: { ...colors }
      }
    });
  };

  const dfs = (u: number, p: number | null = null) => {
    visited.add(u);
    parent[u] = p;
    time++;
    disc[u] = low[u] = time;
    colors[u] = 'gray'; 
    let children = 0;
    pushStep(2, `Visit ${u}`, u, null, 'info');

    const neighbors = adj.get(u) || [];

    for (const v of neighbors) {
      if (v === p) continue;
      pushStep(4, `Check ${u}->${v}`, u, v, 'info');

      if (visited.has(v)) {
        low[u] = Math.min(low[u], disc[v]);
        pushStep(7, `Back-edge to ${v}`, u, v, 'back-edge');
      } else {
        children++;
        pushStep(9, `Recurse ${v}`, u, v, 'info');
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        colors[u] = 'gray'; 
        pushStep(10, `Update Low[${u}]`, u, v, 'update');

        if (p !== null && low[v] >= disc[u]) {
          aps.add(u);
          colors[u] = 'red';
          pushStep(12, `AP Found: ${u}`, u, v, 'found-ap');
        }
      }
    }

    if (p === null && children > 1) {
      aps.add(u);
      colors[u] = 'red';
      pushStep(13, `Root AP: ${u}`, u, null, 'found-ap');
    } else if (!aps.has(u)) {
      colors[u] = 'black'; 
      pushStep(13, `Finish ${u}`, u, null, 'info');
    }
  };

  for (const node of activeNodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return steps;
};
