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

export const TRANSLATIONS = {
  en: {
    title: "Articulation Points",
    subtitle: "DFS / Tarjan's Algorithm Visualizer",
    uploadBtn: "Upload Graph",
    resetBtn: "Reset",
    prevBtn: "Prev",
    nextBtn: "Next",
    playBtn: "Play",
    pauseBtn: "Pause",
    currNode: "Current Node (u)",
    neighbor: "Neighbor (v)",
    algoTrace: "ALGORITHM TRACE",
    valuesTable: "VALUES TABLE",
    step: "STEP",
    start: "START",
    line: "LINE",
    colId: "ID",
    colDisc: "Disc",
    colLow: "Low",
    colParent: "Parent",
    noData: "No data yet",
    startPrompt: "Press Play to start the algorithm analysis.",
    errorParse: "Invalid file format. Please check the structure.",
    legendUnvisited: "Unvisited",
    legendProcessing: "Processing",
    legendVisited: "Visited",
    legendAP: "Articulation Point",
    legendTree: "Tree Edge",
    legendBack: "Back Edge"
  },
  ar: {
    title: "نقاط التمفصل (Articulation)",
    subtitle: "محاكاة خوارزمية تارجان / DFS",
    uploadBtn: "رفع مخطط",
    resetBtn: "إعادة",
    prevBtn: "سابق",
    nextBtn: "تالية",
    playBtn: "تشغيل",
    pauseBtn: "توقف",
    currNode: "العقدة الحالية (u)",
    neighbor: "الجار (v)",
    algoTrace: "تتبع الخوارزمية",
    valuesTable: "جدول القيم",
    step: "خطوة",
    start: "البداية",
    line: "سطر",
    colId: "م",
    colDisc: "D",
    colLow: "L",
    colParent: "الأب",
    noData: "لا توجد بيانات",
    startPrompt: "اضغط تشغيل لبدء تحليل الخوارزمية.",
    errorParse: "صيغة الملف غير صحيحة.",
    legendUnvisited: "غير مزار",
    legendProcessing: "قيد المعالجة",
    legendVisited: "تمت زيارته",
    legendAP: "نقطة مفصلية",
    legendTree: "رابط شجري",
    legendBack: "رابط خلفي"
  }
};