import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { generateScenario, generateDfsSteps } from './utils/graphUtils';
import { Node, Link, AlgorithmStep } from './types';
import ControlPanel from './components/ControlPanel';
import NetworkGraph from './components/NetworkGraph';

const App: React.FC = () => {
  // --- State ---
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  // --- Initialization ---
  useEffect(() => {
    initialize();
  }, []);

  const initialize = () => {
    const { nodes: initNodes, links: initLinks } = generateScenario(CANVAS_WIDTH, CANVAS_HEIGHT);
    setNodes(initNodes);
    setLinks(initLinks);
    
    // Pre-calculate all algorithm steps
    const algoSteps = generateDfsSteps(initNodes, initLinks);
    setSteps(algoSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // --- Controls ---
  const nextStep = useCallback(() => {
    setCurrentStepIndex(prev => {
      if (prev < steps.length - 1) return prev + 1;
      setIsPlaying(false);
      return prev;
    });
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => (prev > 0 ? prev - 1 : 0));
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        nextStep();
      }, 1500); // 1.5 seconds per step for good readability
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, nextStep]);


  // --- Render Helpers ---
  const currentStep = steps[currentStepIndex] || null;

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <ControlPanel 
        currentStep={currentStep}
        totalSteps={steps.length}
        currentStepIndex={currentStepIndex}
        isPlaying={isPlaying}
        onNext={nextStep}
        onPrev={prevStep}
        onPlay={togglePlay}
        onPause={togglePlay}
        onReset={initialize}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0b101e]">
         {/* Background Grid */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
              backgroundSize: '30px 30px'
          }}></div>

        <div className="flex-1 relative flex items-center justify-center p-10">
          <NetworkGraph 
            nodes={nodes}
            links={links}
            currentStepState={currentStep?.state || null}
            highlightNode={currentStep?.highlightNode || null}
            highlightNeighbor={currentStep?.highlightNeighbor || null}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
