import React, { useRef } from 'react';
import { AlgorithmStep } from '../types';
import { PSEUDOCODE, TRANSLATIONS } from '../constants';

interface ControlPanelProps {
  currentStep: AlgorithmStep | null;
  totalSteps: number;
  currentStepIndex: number;
  isPlaying: boolean;
  isSimulating: boolean; // New prop for WSN simulation
  isFinished: boolean;
  hasAPs: boolean;
  isFixed: boolean;
  lang: 'en' | 'ar';
  onNext: () => void;
  onPrev: () => void;
  onPlay: () => void;
  onPause: () => void;
  onSimulate: () => void; // New handler
  onStopSim: () => void; // New handler
  onReset: () => void;
  onFix: () => void;
  onLanguageToggle: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentStep,
  totalSteps,
  currentStepIndex,
  isPlaying,
  isSimulating,
  isFinished,
  hasAPs,
  isFixed,
  lang,
  onNext,
  onPrev,
  onPlay,
  onPause,
  onSimulate,
  onStopSim,
  onReset,
  onFix,
  onLanguageToggle,
  onFileUpload
}) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = lang === 'ar';

  return (
    <div className={`w-full lg:w-[450px] bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-800 flex flex-col h-[50vh] lg:h-full z-10 flex-shrink-0 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            {t.title}
          </h1>
          <p className="text-slate-500 text-xs mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={onLanguageToggle}
             className="px-2 py-1 text-xs border border-slate-700 rounded bg-slate-900 text-slate-400 hover:text-white transition"
           >
             {lang === 'en' ? 'عربي' : 'English'}
           </button>
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="px-2 py-1 text-xs border border-indigo-700 rounded bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900 transition flex items-center gap-1"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
             </svg>
             {t.uploadBtn}
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept=".json,.txt"
             onChange={onFileUpload}
           />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* Simulation Banner */}
        {isSimulating && (
            <div className="bg-amber-900/20 border border-amber-600/50 p-3 rounded animate-pulse">
                <p className="text-amber-500 text-xs font-bold text-center">⚠ {t.simBtn} - Energy Draining...</p>
                <p className="text-amber-700 text-[10px] text-center mt-1">{t.energyInfo}</p>
            </div>
        )}

        {/* 1. Status & Variables */}
        {currentStep && (
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{t.currNode}</div>
                <div className="text-2xl font-mono font-bold text-amber-400">
                  {currentStep.highlightNode !== null ? currentStep.highlightNode : '-'}
                </div>
             </div>
             <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{t.neighbor}</div>
                <div className="text-2xl font-mono font-bold text-blue-400">
                  {currentStep.highlightNeighbor !== null ? currentStep.highlightNeighbor : '-'}
                </div>
             </div>
          </div>
        )}

        {/* 2. Pseudocode */}
        <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-inner">
           <div className={`bg-slate-900 px-3 py-1 text-[10px] text-slate-400 border-b border-slate-800 flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{t.algoTrace}</span>
              <span>{t.line}: {currentStep?.codeLine || '-'}</span>
           </div>
           <div className="p-3 font-mono text-[11px] leading-5" dir="ltr">
              {PSEUDOCODE.map((line, idx) => {
                 const lineNumber = idx + 1;
                 const isActive = currentStep?.codeLine === lineNumber;
                 return (
                   <div 
                      key={idx} 
                      className={`px-2 rounded transition-colors duration-200 ${isActive ? 'bg-indigo-900/50 text-white font-bold border-l-2 border-indigo-400' : 'text-slate-500'}`}
                   >
                     <span className="inline-block w-4 opacity-30 select-none mr-2">{lineNumber}</span>{line}
                   </div>
                 );
              })}
           </div>
        </div>

        {/* 3. Explanation Log */}
        <div className={`p-4 rounded-lg border min-h-[60px] flex items-center shadow-lg transition-colors duration-300 ${
           isFixed ? 'bg-green-950/30 border-green-500/50' :
           currentStep?.explanationType === 'found-ap' ? 'bg-rose-950/30 border-rose-500/50' :
           currentStep?.explanationType === 'back-edge' ? 'bg-purple-950/30 border-purple-500/50' :
           currentStep?.explanationType === 'update' ? 'bg-blue-950/30 border-blue-500/50' :
           'bg-slate-800/50 border-slate-700'
        }`}>
            <p className={`text-sm font-medium ${
               isFixed ? 'text-green-300' :
               currentStep?.explanationType === 'found-ap' ? 'text-rose-300' :
               currentStep?.explanationType === 'back-edge' ? 'text-purple-300' :
               'text-slate-300'
            }`}>
               {isFixed ? t.fixedMsg : (currentStep?.description || t.startPrompt)}
            </p>
        </div>

        {/* 4. Data Table (Disc/Low) */}
        <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase">{t.valuesTable}</h3>
            <div className="bg-slate-950 border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-xs text-left" dir="ltr">
                    <thead className="bg-slate-900 text-slate-400 font-mono">
                        <tr>
                            <th className="p-2 w-10 text-center">{t.colId}</th>
                            <th className="p-2 text-center text-amber-500">{t.colDisc}</th>
                            <th className="p-2 text-center text-cyan-500">{t.colLow}</th>
                            <th className="p-2 text-right">{t.colParent}</th>
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
                            <tr><td colSpan={4} className="p-4 text-center text-slate-600 italic">{t.noData}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Controls Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="grid grid-cols-4 gap-2">
            {/* WSN Simulation Controls */}
            {!isSimulating && !isFixed ? (
                <button onClick={onSimulate} className="col-span-4 lg:col-span-1 py-2 px-1 rounded bg-amber-900/30 border border-amber-700 hover:bg-amber-800/40 text-amber-500 hover:text-amber-300 font-bold text-xs transition">
                    {t.simBtn}
                </button>
            ) : isSimulating ? (
                 <button onClick={onStopSim} className="col-span-4 lg:col-span-4 py-2 px-1 rounded bg-red-900/30 border border-red-700 hover:bg-red-800/40 text-red-500 font-bold text-xs transition animate-pulse">
                    {t.stopSimBtn}
                </button>
            ) : null}

            {isFinished && hasAPs && !isFixed && !isSimulating ? (
                <button onClick={onFix} className="col-span-4 lg:col-span-3 py-2 px-3 rounded bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-green-900/30 animate-pulse transition">
                    {t.fixBtn}
                </button>
            ) : !isSimulating && (
                <>
                    <button onClick={onReset} className="col-span-1 py-2 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs border border-slate-700 transition">
                        {t.resetBtn}
                    </button>
                    <button onClick={onPrev} disabled={currentStepIndex <= 0} className="col-span-1 py-2 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs disabled:opacity-30 transition">
                        {t.prevBtn}
                    </button>
                    
                    {isPlaying ? (
                        <button onClick={onPause} className="col-span-1 py-2 px-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-900/20 transition">
                            {t.pauseBtn}
                        </button>
                    ) : (
                        <button onClick={onPlay} disabled={currentStepIndex >= totalSteps - 1} className="col-span-1 py-2 px-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 disabled:opacity-30 transition">
                            {t.playBtn}
                        </button>
                    )}
                </>
            )}
            
            {!isSimulating && !isFinished && (
               <button onClick={onNext} disabled={currentStepIndex >= totalSteps - 1} className="col-span-4 lg:col-span-1 py-2 px-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/20 disabled:opacity-30 transition">
                   {t.nextBtn}
               </button>
            )}
        </div>
        
        <div className="mt-4">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
                className={`h-full bg-indigo-500 transition-all duration-300`}
                style={{ width: `${totalSteps > 0 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0}%` }}
            ></div>
            </div>
            <div className={`flex justify-between mt-1 text-[10px] text-slate-500 font-mono ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>{t.start}</span>
            <span>{t.step} {currentStepIndex + 1} / {totalSteps}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;