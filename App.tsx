import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { generateScenario, generateDfsSteps, parseUploadedGraph, computeForceLayout } from './utils/graphUtils';
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
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  
  const timerRef = useRef<number | null>(null);

  // --- Initialization ---
  useEffect(() => {
    initialize();
  }, []);

  const initialize = () => {
    // Default Scenario
    const { nodes: initNodes, links: initLinks } = generateScenario(CANVAS_WIDTH, CANVAS_HEIGHT);
    loadGraph(initNodes, initLinks);
  };

  const loadGraph = (newNodes: Node[], newLinks: Link[]) => {
    setNodes(newNodes);
    setLinks(newLinks);
    
    // Pre-calculate all algorithm steps
    const algoSteps = generateDfsSteps(newNodes, newLinks);
    setSteps(algoSteps);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const type = file.name.endsWith('.json') ? 'json' : 'txt';
        const { nodes: rawNodes, links: rawLinks } = parseUploadedGraph(content, type);
        
        // Auto-layout since uploaded files usually don't have x,y
        const { nodes: layoutNodes, links: layoutLinks } = computeForceLayout(rawNodes, rawLinks, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        loadGraph(layoutNodes, layoutLinks);
      } catch (err) {
        alert("Error parsing file. Please use valid JSON or Edge List format.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
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
      }, 1500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, nextStep]);


  // --- Render Helpers ---
  const currentStep = steps[currentStepIndex] || null;

  return (
    <div className={`flex flex-col lg:flex-row h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans ${lang === 'ar' ? 'lg:flex-row-reverse' : ''}`}>
      
      {/* Control Panel (Bottom on mobile, Side on desktop) */}
      <ControlPanel 
        currentStep={currentStep}
        totalSteps={steps.length}
        currentStepIndex={currentStepIndex}
        isPlaying={isPlaying}
        lang={lang}
        onNext={nextStep}
        onPrev={prevStep}
        onPlay={togglePlay}
        onPause={togglePlay}
        onReset={initialize}
        onLanguageToggle={() => setLang(l => l === 'en' ? 'ar' : 'en')}
        onFileUpload={handleFileUpload}
      />

      {/* Graph Area (Top on mobile, Main on desktop) */}
      <div className="flex-1 flex flex-col h-[50vh] lg:h-full overflow-hidden relative bg-[#0b101e] order-first lg:order-none">
         {/* Background Grid */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
              backgroundSize: '30px 30px'
          }}></div>

        <div className="flex-1 relative flex items-center justify-center p-2 lg:p-10">
          <NetworkGraph 
            nodes={nodes}
            links={links}
            currentStepState={currentStep?.state || null}
            highlightNode={currentStep?.highlightNode || null}
            highlightNeighbor={currentStep?.highlightNeighbor || null}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
};

export default App;