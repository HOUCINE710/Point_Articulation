import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Node, Link, DfsState } from '../types';
import { COLORS, TRANSLATIONS } from '../constants';

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
    svg.selectAll("*").remove(); // Clear canvas

    // --- Arrow Marker ---
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", COLORS.edgeTree);

    // --- Links ---
    svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("x1", d => nodes[d.source].x)
      .attr("y1", d => nodes[d.source].y)
      .attr("x2", d => nodes[d.target].x)
      .attr("y2", d => nodes[d.target].y)
      .attr("stroke", d => {
        // Dynamic Link Coloring
        if (!currentStepState) return COLORS.edgeNormal;
        
        const isConnectedToCurrent = 
          (d.source === highlightNode && d.target === highlightNeighbor) ||
          (d.target === highlightNode && d.source === highlightNeighbor);

        if (isConnectedToCurrent) return "#fff"; // Bright highlight for active edge

        // Check if it's a "Tree Edge" (parent-child relationship)
        const p1 = currentStepState.parents[d.target];
        const p2 = currentStepState.parents[d.source];
        
        if (p1 === d.source || p2 === d.target) return COLORS.edgeTree;
        
        // If both visited but not parent-child, it's a back edge
        if (currentStepState.visited.has(d.source) && currentStepState.visited.has(d.target)) return COLORS.edgeBack;
        
        return COLORS.edgeNormal;
      })
      .attr("stroke-width", d => {
         const isConnectedToCurrent = 
          (d.source === highlightNode && d.target === highlightNeighbor) ||
          (d.target === highlightNode && d.source === highlightNeighbor);
         return isConnectedToCurrent ? 3 : 2;
      })
      .attr("stroke-dasharray", d => {
        if (!currentStepState) return "none";
        const p1 = currentStepState.parents[d.target];
        const p2 = currentStepState.parents[d.source];
        const isTree = p1 === d.source || p2 === d.target;
        // If visited but not tree, it is likely back edge
        if (!isTree && currentStepState.visited.has(d.source) && currentStepState.visited.has(d.target)) return "5,5";
        return "none";
      });

    // --- Nodes Group ---
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node Circle
    nodeGroup.append("circle")
      .attr("r", 18)
      .attr("fill", d => {
        if (!currentStepState) return COLORS.nodeUnvisited;
        const color = currentStepState.colors[d.id] || 'white';
        if (color === 'red') return COLORS.nodeAP;
        if (color === 'gray') return COLORS.nodeVisiting;
        if (color === 'black') return COLORS.nodeVisited;
        return COLORS.nodeUnvisited;
      })
      .attr("stroke", d => d.id === highlightNode ? "#fff" : d.id === highlightNeighbor ? COLORS.nodeVisiting : "none")
      .attr("stroke-width", 3);

    // Node ID
    nodeGroup.append("text")
      .text(d => d.id)
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#1e293b")
      .attr("font-weight", "bold")
      .attr("font-size", "14px");

    // --- Badges (Disc / Low) ---
    // Only show if visited
    const badgeGroup = nodeGroup.filter(d => currentStepState ? currentStepState.visited.has(d.id) : false);

    // Badge Background
    badgeGroup.append("rect")
      .attr("x", -20)
      .attr("y", -38)
      .attr("width", 40)
      .attr("height", 16)
      .attr("rx", 4)
      .attr("fill", "#0f172a")
      .attr("stroke", "#334155");

    // Badge Text
    badgeGroup.append("text")
      .text(d => {
        const disc = currentStepState?.discoveryTime[d.id];
        const low = currentStepState?.lowLink[d.id];
        return `${disc ?? '-'} | ${low ?? '-'}`;
      })
      .attr("x", 0)
      .attr("y", -26)
      .attr("text-anchor", "middle")
      .attr("fill", "#cbd5e1")
      .attr("font-family", "monospace")
      .attr("font-size", "10px");

    // Labels for D and L
    badgeGroup.append("text")
      .text("d   L")
      .attr("x", 0)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "8px");

  }, [nodes, links, currentStepState, width, height, highlightNode, highlightNeighbor, lang]);

  return (
    <div className="relative border border-slate-800 rounded-lg bg-slate-950 overflow-hidden shadow-2xl w-full h-full flex items-center justify-center">
      <svg 
         ref={svgRef} 
         viewBox={`0 0 ${width} ${height}`}
         className="w-full h-full max-h-[80vh] max-w-full" 
         preserveAspectRatio="xMidYMid meet"
      />
      
      {/* Legend */}
      <div className={`absolute top-4 ${isRTL ? 'right-4 text-right' : 'left-4 text-left'} bg-slate-900/90 p-3 rounded border border-slate-700 backdrop-blur text-xs pointer-events-none`}>
        <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-slate-300"></div> <span className="text-slate-400">{t.legendUnvisited}</span>
        </div>
        <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div> <span className="text-slate-400">{t.legendProcessing}</span>
        </div>
        <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div> <span className="text-slate-400">{t.legendVisited}</span>
        </div>
        <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div> <span className="text-rose-400 font-bold">{t.legendAP}</span>
        </div>
        <div className="mt-2 border-t border-slate-700 pt-2">
            <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-0.5 bg-blue-500"></div> <span className="text-slate-400">{t.legendTree}</span>
            </div>
            <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-0.5 border-t-2 border-dashed border-purple-500"></div> <span className="text-slate-400">{t.legendBack}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;