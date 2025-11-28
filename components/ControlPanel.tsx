import React from 'react';
import { AlgorithmStep } from '../types';
import { PSEUDOCODE } from '../constants';

interface ControlPanelProps {
  currentStep: AlgorithmStep | null;
  totalSteps: number;
  currentStepIndex: number;
  isPlaying: boolean;
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentStep,
  totalSteps,
  currentStepIndex,
  isPlaying,
  onNext,
  onPrev,
  onPlay,
  onPause,
  onReset
}) => {
  return (
    <div className="w-[450px] bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10 flex-shrink-0">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          Articulation Points
        </h1>
        <p className="text-slate-500 text-xs mt-1">DFS / Tarjan's Algorithm Visualizer</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* 1. Status & Variables */}
        {currentStep && (
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Current Node (u)</div>
                <div className="text-2xl font-mono font-bold text-amber-400">
                  {currentStep.highlightNode !== null ? currentStep.highlightNode : '-'}
                </div>
             </div>
             <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Neighbor (v)</div>
                <div className="text-2xl font-mono font-bold text-blue-400">
                  {currentStep.highlightNeighbor !== null ? currentStep.highlightNeighbor : '-'}
                </div>
             </div>
          </div>
        )}

        {/* 2. Pseudocode */}
        <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-inner">
           <div className="bg-slate-900 px-3 py-1 text-[10px] text-slate-400 border-b border-slate-800 flex justify-between">
              <span>ALGORITHM TRACE</span>
              <span>LINE: {currentStep?.codeLine || '-'}</span>
           </div>
           <div className="p-3 font-mono text-[11px] leading-5">
              {PSEUDOCODE.map((line, idx) => {
                 const lineNumber = idx + 1;
                 const isActive = currentStep?.codeLine === lineNumber;
                 return (
                   <div 
                      key={idx} 
                      className={`px-2 rounded transition-colors duration-200 ${isActive ? 'bg-indigo-900/50 text-white font-bold border-l-2 border-indigo-400' : 'text-slate-500'}`}
                   >
                     <span className="inline-block w-4 opacity-30 select-none">{lineNumber}</span> {line}
                   </div>
                 );
              })}
           </div>
        </div>

        {/* 3. Explanation Log */}
        <div className={`p-4 rounded-lg border min-h-[80px] flex items-center shadow-lg transition-colors duration-300 ${
           currentStep?.explanationType === 'found-ap' ? 'bg-rose-950/30 border-rose-500/50' :
           currentStep?.explanationType === 'back-edge' ? 'bg-purple-950/30 border-purple-500/50' :
           currentStep?.explanationType === 'update' ? 'bg-blue-950/30 border-blue-500/50' :
           'bg-slate-800/50 border-slate-700'
        }`}>
            <p className={`text-sm font-medium ${
               currentStep?.explanationType === 'found-ap' ? 'text-rose-300' :
               currentStep?.explanationType === 'back-edge' ? 'text-purple-300' :
               'text-slate-300'
            }`}>
               {currentStep?.description || "Press Play to start the algorithm analysis."}
            </p>
        </div>

        {/* 4. Data Table (Disc/Low) */}
        <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Values Table</h3>
            <div className="bg-slate-950 border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-slate-400 font-mono">
                        <tr>
                            <th className="p-2 w-10 text-center">ID</th>
                            <th className="p-2 text-center text-amber-500">Disc</th>
                            <th className="p-2 text-center text-cyan-500">Low</th>
                            <th className="p-2 text-right">Parent</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                        {currentStep && Object.keys(currentStep.state.discoveryTime).map(key => {
                             const id = parseInt(key);
                             const isCurrent = id === currentStep.highlightNode;
                             const isNeighbor = id === currentStep.highlightNeighbor;
                             return (
                                <tr key={id} className={isCurrent ? 'bg-amber-500/10' : isNeighbor ? 'bg-blue-500/10' : ''}>
                                    <td className="p-2 text-center font-bold text-slate-500">{id}</td>
                                    <td className="p-2 text-center">{currentStep.state.discoveryTime[id]}</td>
                                    <td className="p-2 text-center font-bold">{currentStep.state.lowLink[id]}</td>
                                    <td className="p-2 text-right text-slate-500">
                                        {currentStep.state.parents[id] !== null ? currentStep.state.parents[id] : '-'}
                                    </td>
                                </tr>
                             );
                        })}
                        {(!currentStep || Object.keys(currentStep.state.discoveryTime).length === 0) && (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-600 italic">No data yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Controls Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 grid grid-cols-4 gap-2">
          <button onClick={onReset} className="col-span-1 py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs border border-slate-700 transition">
             RESET
          </button>
          <button onClick={onPrev} disabled={currentStepIndex <= 0} className="col-span-1 py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs disabled:opacity-30 transition">
             PREV
          </button>
          
          {isPlaying ? (
             <button onClick={onPause} className="col-span-1 py-2 px-3 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-900/20 transition">
                PAUSE
             </button>
          ) : (
             <button onClick={onPlay} disabled={currentStepIndex >= totalSteps - 1} className="col-span-1 py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 disabled:opacity-30 transition">
                PLAY
             </button>
          )}

          <button onClick={onNext} disabled={currentStepIndex >= totalSteps - 1} className="col-span-1 py-2 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/20 disabled:opacity-30 transition">
             NEXT
          </button>
          
          <div className="col-span-4 mt-2">
             <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-indigo-500 transition-all duration-300"
                   style={{ width: `${totalSteps > 0 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0}%` }}
                ></div>
             </div>
             <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
                <span>START</span>
                <span>STEP {currentStepIndex + 1} / {totalSteps}</span>
             </div>
          </div>
      </div>
    </div>
  );
};

export default ControlPanel;
