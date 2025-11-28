export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 800;

export const COLORS = {
  background: '#0f172a', // slate-950
  nodeUnvisited: '#cbd5e1', // slate-300
  nodeVisiting: '#f59e0b', // amber-500 (Processing)
  nodeVisited: '#10b981', // emerald-500 (Done)
  nodeAP: '#ef4444', // red-500 (Articulation Point)
  edgeNormal: '#334155', // slate-700
  edgeTree: '#3b82f6', // blue-500 (Solid)
  edgeBack: '#a855f7', // purple-500 (Dashed)
  textMain: '#f8fafc',
  textSub: '#94a3b8'
};

export const PSEUDOCODE = [
  "function FindAP(u, p):",
  "  visited[u] = true; disc[u] = low[u] = ++time",
  "  children = 0",
  "  for each v in adj[u]:",
  "    if v == p: continue",
  "    if visited[v]:",
  "      low[u] = min(low[u], disc[v]) // Back-edge",
  "    else:",
  "      children++; FindAP(v, u)",
  "      low[u] = min(low[u], low[v])",
  "      if p != null and low[v] >= disc[u]:",
  "        AP_Found(u)",
  "  if p == null and children > 1: AP_Found(u)"
];
