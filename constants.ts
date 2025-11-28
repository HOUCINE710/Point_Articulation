
export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 800;

export const SENSOR_CONFIG = {
  defaultRange: 160, // Increased slightly to ensure connectivity
  defaultEnergy: 100,
  drainRateNormal: 1, // Slow drain for normal nodes
  drainRateAP: 15,    // FAST drain for Critical nodes (simulation focus)
  lowBatteryThreshold: 30,
  wakeUpThreshold: 5, // Wake up when neighbor is practically dead
};

export const COLORS = {
  background: '#0f172a', // slate-950
  nodeUnvisited: '#cbd5e1', // slate-300
  nodeVisiting: '#f59e0b', // amber-500
  nodeVisited: '#10b981', // emerald-500
  nodeAP: '#ef4444', // red-500
  nodeDead: '#334155', // slate-700
  nodeSleeping: '#64748b', // slate-500 (Cool grey)
  edgeNormal: '#334155', 
  edgeTree: '#3b82f6', 
  edgeBack: '#a855f7', 
  edgeReinforce: '#4ade80',
  textMain: '#f8fafc',
  textSub: '#94a3b8',
  batteryHigh: '#22c55e',
  batteryLow: '#eab308',
  batteryCritical: '#ef4444',
  rangeCircle: 'rgba(59, 130, 246, 0.1)'
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
    title: "WSN Reliability Analyzer",
    subtitle: "Self-Healing Network Simulation",
    uploadBtn: "Upload Graph",
    resetBtn: "Reset System",
    prevBtn: "Prev",
    nextBtn: "Next",
    playBtn: "Trace Algo",
    pauseBtn: "Pause",
    simBtn: "⚡ Simulate Operation",
    stopSimBtn: "⏹ Stop Simulation",
    fixBtn: "🛡️ Reinforce Network",
    fixedMsg: "Network Secured! New links added to bypass critical points.",
    currNode: "Current Sensor (u)",
    neighbor: "Neighbor (v)",
    algoTrace: "ALGORITHM TRACE",
    valuesTable: "SENSORS STATUS",
    step: "STEP",
    start: "SYSTEM READY",
    line: "LINE",
    colId: "ID",
    colDisc: "Disc",
    colLow: "Low",
    colParent: "Parent",
    noData: "No active analysis",
    startPrompt: "System Initialized. Sensors Online.",
    errorParse: "Invalid file format.",
    legendUnvisited: "Active Sensor",
    legendProcessing: "Scanning",
    legendVisited: "Scanned",
    legendAP: "Critical Node (AP)",
    legendTree: "Tree Link",
    legendBack: "Back Link",
    legendReinforce: "Backup Link",
    legendDead: "Dead Sensor",
    legendSleeping: "Sleeping (Spare)",
    energyInfo: "CRITICAL ALERT: APs consuming high energy. Spares deployed."
  },
  ar: {
    title: "تحليل موثوقية الشبكة (WSN)",
    subtitle: "محاكاة الشبكات ذاتية الإصلاح",
    uploadBtn: "رفع مخطط",
    resetBtn: "إعادة ضبط",
    prevBtn: "سابق",
    nextBtn: "تالية",
    playBtn: "تتبع الخوارزمية",
    pauseBtn: "توقف",
    simBtn: "⚡ تشغيل ميداني",
    stopSimBtn: "⏹ إيقاف المحاكاة",
    fixBtn: "🛡️ تدعيم الشبكة",
    fixedMsg: "تم تأمين الشبكة! أضيفت وصلات لتجاوز النقاط الحرجة.",
    currNode: "المستشعر الحالي (u)",
    neighbor: "الجار (v)",
    algoTrace: "تتبع الخوارزمية",
    valuesTable: "حالة المستشعرات",
    step: "خطوة",
    start: "جاهز",
    line: "سطر",
    colId: "م",
    colDisc: "D",
    colLow: "L",
    colParent: "الأب",
    noData: "لا يوجد تحليل",
    startPrompt: "النظام جاهز. المستشعرات تعمل.",
    errorParse: "ملف غير صالح.",
    legendUnvisited: "مستشعر نشط",
    legendProcessing: "جاري الفحص",
    legendVisited: "تم فحصه",
    legendAP: "عقدة حرجة (AP)",
    legendTree: "رابط شجري",
    legendBack: "رابط خلفي",
    legendReinforce: "وصلة تدعيم",
    legendDead: "مستشعر ميت",
    legendSleeping: "نائم (احتياطي)",
    energyInfo: "تنبيه: استهلاك عالٍ للطاقة في النقاط الحرجة. تم نشر البدلاء."
  }
};
