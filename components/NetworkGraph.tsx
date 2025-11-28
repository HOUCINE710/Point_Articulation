import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Node, Link, DfsState } from '../types';
import { COLORS, TRANSLATIONS, SENSOR_CONFIG } from '../constants';

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  currentStepState: DfsState | null;
  width: number;
  height: number;
  highlightNode: number | null;
  highlightNeighbor: number | null;
  lang: 'en' | 'ar';
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  nodes, 
  links, 
  currentStepState, 
  width, 
  height,
  highlightNode,
  highlightNeighbor,
  lang
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodeMap = new Map<number, Node>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const getX = (id: number) => nodeMap.get(id)?.x ?? 0;
    const getY = (id: number) => nodeMap.get(id)?.y ?? 0;

    // --- Defs for Gradients/Markers ---
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28) 
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", COLORS.edgeTree);

    // --- Detection Ranges (Active Only) ---
    svg.append("g")
        .selectAll("circle")
        .data(nodes.filter(n => n.status === 'active'))
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.range)
        .attr("fill", COLORS.rangeCircle)
        .attr("stroke", COLORS.edgeTree)
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", "4,4")
        .attr("class", "animate-pulse-slow");

    // --- Links ---
    const activeLinks = links.filter(l => {
        const s = nodeMap.get(typeof l.source === 'object' ? (l.source as any).id : l.source);
        const t = nodeMap.get(typeof l.target === 'object' ? (l.target as any).id : l.target);
        // Link exists if both are ACTIVE
        return s && s.status === 'active' && t && t.status === 'active';
    });

    svg.append("g")
      .selectAll("line")
      .data(activeLinks)
      .enter()
      .append("line")
      .attr("x1", d => getX(typeof d.source === 'object' ? (d.source as any).id : d.source))
      .attr("y1", d => getY(typeof d.source === 'object' ? (d.source as any).id : d.source))
      .attr("x2", d => getX(typeof d.target === 'object' ? (d.target as any).id : d.target))
      .attr("y2", d => getY(typeof d.target === 'object' ? (d.target as any).id : d.target))
      .attr("stroke", d => {
        if (d.type === 'reinforce') return COLORS.edgeReinforce;
        if (!currentStepState) return COLORS.edgeNormal;
        
        const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;

        const isConnectedToCurrent = 
          (sId === highlightNode && tId === highlightNeighbor) ||
          (tId === highlightNode && sId === highlightNeighbor);

        if (isConnectedToCurrent) return "#fff";

        const p1 = currentStepState.parents[tId];
        const p2 = currentStepState.parents[sId];
        
        if (p1 === sId || p2 === tId) return COLORS.edgeTree;
        if (currentStepState.visited.has(sId) && currentStepState.visited.has(tId)) return COLORS.edgeBack;
        return COLORS.edgeNormal;
      })
      .attr("stroke-width", d => {
         if (d.type === 'reinforce') return 3;
         const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
         const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
         const isConnectedToCurrent = 
          (sId === highlightNode && tId === highlightNeighbor) ||
          (tId === highlightNode && sId === highlightNeighbor);
         return isConnectedToCurrent ? 3 : 2;
      })
      .attr("stroke-dasharray", d => {
        if (d.type === 'reinforce') return "8,4";
        if (!currentStepState) return "none";
        const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
        const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
        const p1 = currentStepState.parents[tId];
        const p2 = currentStepState.parents[sId];
        const isTree = p1 === sId || p2 === tId;
        if (!isTree && currentStepState.visited.has(sId) && currentStepState.visited.has(tId)) return "5,5";
        return "none";
      })
      .attr("class", d => d.type === 'reinforce' ? 'animate-pulse' : '');

    // --- Nodes Group ---
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("opacity", d => d.status === 'dead' ? 0.3 : d.status === 'sleeping' ? 0.6 : 1);

    // Node Circle
    nodeGroup.append("circle")
      .attr("r", 20)
      .attr("fill", d => {
        if (d.status === 'dead') return COLORS.nodeDead;
        if (d.status === 'sleeping') return COLORS.nodeSleeping;
        
        if (!currentStepState) return COLORS.nodeUnvisited;
        const color = currentStepState.colors[d.id] || 'white';
        if (color === 'red') return COLORS.nodeAP;
        if (color === 'gray') return COLORS.nodeVisiting;
        if (color === 'black') return COLORS.nodeVisited;
        return COLORS.nodeUnvisited;
      })
      .attr("stroke", d => {
          if (d.status === 'dead') return "#000";
          if (d.status === 'sleeping') return "#475569";
          return d.id === highlightNode ? "#fff" : d.id === highlightNeighbor ? COLORS.nodeVisiting : "#1e293b";
      })
      .attr("stroke-width", d => d.status === 'sleeping' ? 1 : 3)
      .attr("stroke-dasharray", d => d.status === 'sleeping' ? "4,2" : "none");

    // Sleep Icon for Sleeping Nodes
    nodeGroup.filter(d => d.status === 'sleeping')
        .append("text")
        .text("zZ")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#cbd5e1")
        .attr("font-size", "14px");

    // Node ID (for active/dead only)
    nodeGroup.filter(d => d.status !== 'sleeping')
      .append("text")
      .text(d => d.id)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("fill", d => d.status === 'dead' ? "#64748b" : "#1e293b")
      .attr("font-weight", "bold")
      .attr("font-size", "14px");

    // --- Battery Indicator (Only ACTIVE nodes) ---
    const activeNodeGroup = nodeGroup.filter(d => d.status === 'active');

    activeNodeGroup.append("rect")
        .attr("x", 26)
        .attr("y", -15)
        .attr("width", 8)
        .attr("height", 30)
        .attr("fill", "#0f172a")
        .attr("stroke", "#475569")
        .attr("rx", 2);
    
    activeNodeGroup.append("rect")
        .attr("x", 27)
        .attr("y", d => -14 + (30 * (1 - d.energy/d.maxEnergy))) 
        .attr("width", 6)
        .attr("height", d => Math.max(0, 28 * (d.energy/d.maxEnergy)))
        .attr("fill", d => {
            if (d.energy < SENSOR_CONFIG.lowBatteryThreshold) return COLORS.batteryCritical;
            if (d.energy < 60) return COLORS.batteryLow;
            return COLORS.batteryHigh;
        })
        .attr("rx", 1);
    
    activeNodeGroup.append("text")
        .text(d => `${Math.ceil(d.energy)}%`)
        .attr("x", 40)
        .attr("y", 5)
        .attr("font-size", "9px")
        .attr("fill", "#94a3b8")
        .attr("alignment-baseline", "middle");


    // --- Badges ---
    const badgeGroup = nodeGroup.filter(d => d.status === 'active' && (currentStepState ? currentStepState.visited.has(d.id) : false));

    badgeGroup.append("rect")
      .attr("x", -20)
      .attr("y", -42)
      .attr("width", 40)
      .attr("height", 16)
      .attr("rx", 4)
      .attr("fill", "#0f172a")
      .attr("stroke", "#334155");

    badgeGroup.append("text")
      .text(d => {
        const disc = currentStepState?.discoveryTime[d.id];
        const low = currentStepState?.lowLink[d.id];
        return `${disc ?? '-'} | ${low ?? '-'}`;
      })
      .attr("x", 0)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-family", "monospace")
      .attr("font-size", "10px");

  }, [nodes, links, currentStepState, width, height, highlightNode, highlightNeighbor, lang]);

  return (
    <div className="relative border border-slate-800 rounded-lg bg-slate-950 overflow-hidden shadow-2xl w-full h-full flex items-center justify-center">
      <svg 
         ref={svgRef} 
         viewBox={`0 0 ${width} ${height}`}
         className="w-full h-full max-h-[80vh] max-w-full" 
         preserveAspectRatio="xMidYMid meet"
      >
        <style>{`
          .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; stroke-width: 3px; } 50% { opacity: .5; stroke-width: 2px; } }
          .animate-pulse-slow { animation: pulseOp 4s ease-in-out infinite; }
          @keyframes pulseOp { 0%, 100% { opacity: 0.1; r: ${SENSOR_CONFIG.defaultRange}px; } 50% { opacity: 0.15; r: ${SENSOR_CONFIG.defaultRange + 5}px; } }
        `}</style>
      </svg>
      
      {/* Legend */}
      <div className={`absolute top-4 ${isRTL ? 'right-4 text-right' : 'left-4 text-left'} bg-slate-900/90 p-3 rounded border border-slate-700 backdrop-blur text-xs pointer-events-none`}>
        <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-slate-300"></div> <span className="text-slate-400">{t.legendUnvisited}</span>
        </div>
         <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500"></div> <span className="text-slate-500">{t.legendDead}</span>
        </div>
        <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-slate-500 border border-dashed border-slate-400"></div> <span className="text-slate-400 italic">{t.legendSleeping}</span>
        </div>
        <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div> <span className="text-rose-400 font-bold">{t.legendAP}</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;