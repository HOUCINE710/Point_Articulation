import { Node, Link, AlgorithmStep, DfsState } from '../types';
import * as d3 from 'd3';

export const getDistance = (n1: Node, n2: Node) => 
  Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));

/**
 * Calculates node positions using D3 Force Simulation
 * Useful for uploaded graphs that lack x/y coordinates
 */
export const computeForceLayout = (nodes: {id: number}[], links: {source: number, target: number}[], width: number, height: number): { nodes: Node[], links: Link[] } => {
  // Create copies to avoid mutation issues during simulation
  const simNodes = nodes.map(n => ({ id: n.id, x: width/2, y: height/2 }));
  const simLinks = links.map(l => ({ source: l.source, target: l.target }));

  const simulation = d3.forceSimulation(simNodes as any)
    .force("link", d3.forceLink(simLinks).id((d: any) => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(40));

  // Run simulation synchronously to settle positions
  simulation.tick(300); // 300 ticks is usually enough to stabilize

  // Map back to our Node/Link types
  const finalNodes: Node[] = simNodes.map((n: any) => ({
    id: n.id,
    x: Math.max(20, Math.min(width - 20, n.x)), // Clamp to bounds
    y: Math.max(20, Math.min(height - 20, n.y))
  }));

  const finalLinks: Link[] = simLinks.map((l: any) => ({
    source: typeof l.source === 'object' ? l.source.id : l.source,
    target: typeof l.target === 'object' ? l.target.id : l.target
  }));

  return { nodes: finalNodes, links: finalLinks };
};

/**
 * Parsing Logic for Uploaded Files
 */
export const parseUploadedGraph = (content: string, type: 'json' | 'txt'): { nodes: {id: number}[], links: {source: number, target: number}[] } => {
  let rawLinks: {source: number, target: number}[] = [];
  
  if (type === 'json') {
    try {
      const data = JSON.parse(content);
      // Support { links: [...] } or just [...]
      const linkArray = Array.isArray(data) ? data : (data.links || []);
      rawLinks = linkArray.map((l: any) => ({
        source: Number(l.source),
        target: Number(l.target)
      }));
    } catch (e) {
      throw new Error("Invalid JSON");
    }
  } else {
    // Text format: "0 1\n1 2"
    const lines = content.trim().split(/\r?\n/);
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        rawLinks.push({
          source: Number(parts[0]),
          target: Number(parts[1])
        });
      }
    });
  }

  // Extract unique nodes from links
  const nodeSet = new Set<number>();
  rawLinks.forEach(l => {
    nodeSet.add(l.source);
    nodeSet.add(l.target);
  });
  
  const nodes = Array.from(nodeSet).map(id => ({ id }));
  return { nodes, links: rawLinks };
};

/**
 * Generates the butterfly/demo topology
 */
export const generateScenario = (width: number, height: number): { nodes: Node[], links: Link[] } => {
  const cx = width / 2;
  const cy = height / 2;
  
  const nodes: Node[] = [
    { id: 0, x: cx, y: cy }, // Center
    { id: 1, x: cx - 120, y: cy - 100 },
    { id: 2, x: cx - 120, y: cy + 100 },
    { id: 3, x: cx - 220, y: cy }, // Left-most
    { id: 4, x: cx + 120, y: cy - 100 },
    { id: 5, x: cx + 120, y: cy + 100 },
    { id: 6, x: cx + 220, y: cy }, // Right-most
    { id: 7, x: cx, y: cy - 180 }, // Top hanger
  ];

  const links: Link[] = [
    { source: 0, target: 1 }, { source: 0, target: 2 }, { source: 1, target: 2 }, 
    { source: 1, target: 3 }, { source: 2, target: 3 }, 
    { source: 0, target: 4 }, { source: 0, target: 5 }, { source: 4, target: 5 }, 
    { source: 4, target: 6 }, { source: 5, target: 6 },
    { source: 0, target: 7 }, 
    { source: 7, target: 1 }  
  ];

  return { nodes, links };
};

/**
 * The Core Logic: Runs DFS and records every single visual step
 */
export const generateDfsSteps = (nodes: Node[], links: Link[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const adj = new Map<number, number[]>();
  
  // Initialize Graph
  nodes.forEach(n => adj.set(n.id, []));
  links.forEach(l => {
    // Ensure nodes exist in map (handling disconnected components if any)
    if (!adj.has(l.source)) adj.set(l.source, []);
    if (!adj.has(l.target)) adj.set(l.target, []);
    
    adj.get(l.source)?.push(l.target);
    adj.get(l.target)?.push(l.source);
  });

  // Sort neighbors for deterministic visualization
  nodes.forEach(n => {
    adj.get(n.id)?.sort((a, b) => a - b);
  });

  // State Variables
  let time = 0;
  const disc: Record<number, number> = {};
  const low: Record<number, number> = {};
  const parent: Record<number, number | null> = {};
  const visited = new Set<number>();
  const aps = new Set<number>();
  const colors: Record<number, 'white' | 'gray' | 'black' | 'red'> = {};

  nodes.forEach(n => colors[n.id] = 'white');

  // Helper to push state
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
        colors: { ...colors } // Snapshot colors
      }
    });
  };

  const dfs = (u: number, p: number | null = null) => {
    visited.add(u);
    parent[u] = p;
    time++;
    disc[u] = low[u] = time;
    colors[u] = 'gray'; // Currently processing
    let children = 0;

    pushStep(2, `Visit Node ${u}. Set Disc[${u}] = Low[${u}] = ${time}.`, u, null, 'info');

    const neighbors = adj.get(u) || [];

    for (const v of neighbors) {
      if (v === p) continue; // Skip parent

      pushStep(4, `Checking neighbor ${v} of Node ${u}...`, u, v, 'info');

      if (visited.has(v)) {
        // Back Edge
        const oldLow = low[u];
        low[u] = Math.min(low[u], disc[v]);
        pushStep(7, `Back-edge to visited Node ${v}! Updating Low[${u}]: min(${oldLow}, Disc[${v}]=${disc[v]}) -> ${low[u]}`, u, v, 'back-edge');
      } else {
        // Tree Edge
        children++;
        pushStep(9, `Node ${v} is unvisited. Recursing DFS...`, u, v, 'info');
        
        dfs(v, u);

        // After return
        const oldLow = low[u];
        low[u] = Math.min(low[u], low[v]);
        colors[u] = 'gray'; // Set back to processing after child returns
        pushStep(10, `Returned to ${u}. Child ${v} has Low ${low[v]}. Updating Low[${u}] -> ${low[u]}`, u, v, 'update');

        // Check AP
        if (p !== null && low[v] >= disc[u]) {
          pushStep(11, `Check: Low[${v}] (${low[v]}) >= Disc[${u}] (${disc[u]})? YES.`, u, v, 'found-ap');
          aps.add(u);
          colors[u] = 'red';
          pushStep(12, `Node ${u} is an Articulation Point! Removing it disconnects ${v}.`, u, v, 'found-ap');
        }
      }
    }

    if (p === null && children > 1) {
      aps.add(u);
      colors[u] = 'red';
      pushStep(13, `Root Node ${u} has ${children} children > 1. It is an AP.`, u, null, 'found-ap');
    } else if (!aps.has(u)) {
      colors[u] = 'black'; // Done
      pushStep(13, `Finished processing Node ${u}.`, u, null, 'info');
    }
  };

  // Run Algo
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      pushStep(1, `Start DFS from unvisited root Node ${node.id}`, node.id, null, 'info');
      dfs(node.id);
    }
  }

  return steps;
};