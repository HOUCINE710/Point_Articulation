
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SENSOR_CONFIG } from './constants';
import { generateScenario, generateDfsSteps, parseUploadedGraph, computeForceLayout, calculateFixes, recalculateLinksBasedOnRange, getDistance, spawnSleepingNodesForAPs } from './utils/graphUtils';
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
  const [isSimulating, setIsSimulating] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [isFixed, setIsFixed] = useState(false);
  const [simulatedAPs, setSimulatedAPs] = useState<Set<number>>(new Set());
  
  const timerRef = useRef<number | null>(null);
  const simulationTimerRef = useRef<number | null>(null);

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
    setIsSimulating(false);
    setIsFixed(false);
    setSimulatedAPs(new Set());
    if (timerRef.current) clearInterval(timerRef.current);
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
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
        const { nodes: layoutNodes, links: layoutLinks } = computeForceLayout(rawNodes, rawLinks, CANVAS_WIDTH, CANVAS_HEIGHT);
        loadGraph(layoutNodes, layoutLinks);
      } catch (err) {
        alert("Error parsing file. Please use valid JSON or Edge List format.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFixNetwork = () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;
    const aps = currentStep.state.articulationPoints;
    if (aps.size === 0) return;

    const reinforcementLinks = calculateFixes(nodes, links, aps);
    setLinks(prev => [...prev, ...reinforcementLinks]);
    setIsFixed(true);
  };

  // --- Dynamic Algorithm Update ---
  const refreshAlgorithm = (currentNodes: Node[], currentLinks: Link[]) => {
    const newSteps = generateDfsSteps(currentNodes, currentLinks);
    setSteps(newSteps);
    setCurrentStepIndex(Math.max(0, newSteps.length - 1));
  };

  // --- WSN Simulation Logic ---
  const toggleSimulation = () => {
     if (isSimulating) {
         setIsSimulating(false);
         if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
     } else {
         setIsPlaying(false); // Stop algo trace
         
         // 1. Identify Articulation Points BEFORE Simulation starts
         // We use the final step of the current analysis
         const finalStep = steps[steps.length - 1];
         const apSet = finalStep ? finalStep.state.articulationPoints : new Set<number>();
         setSimulatedAPs(apSet);

         // 2. Add Sleeping Nodes NEXT TO APs
         let nodesWithSleepers = spawnSleepingNodesForAPs(nodes, apSet);
         setNodes(nodesWithSleepers);

         setIsSimulating(true);
         // 3. Start Loop
         simulationTimerRef.current = window.setInterval(runSimulationTick, 1000);
     }
  };

  const runSimulationTick = () => {
    setNodes(prevNodes => {
        let topologyChanged = false;
        
        // We need to access the LATEST 'simulatedAPs' which is captured in closure or state.
        // Since we are in setNodes callback, we use the state directly if accessible or updated.
        // Note: simulateAPs state variable might be stale in this callback if not careful, 
        // but since we set it once at toggle, it should be fine. To be safe, we read a Ref if needed, 
        // but here assuming apSet doesn't change during sim for drain logic (APs die, they are still "AP" roles).

        const newNodes = prevNodes.map(node => {
            if (node.status !== 'active') return node;

            // DRAIN LOGIC
            let drain = SENSOR_CONFIG.drainRateNormal;
            
            // Check if this node is one of the original APs
            // (We iterate through simulatedAPs state, but here we can cheat and look at steps if state is tricky)
            // Ideally use the simulatedAPs state.
            // CAUTION: setSimulatedAPs update might not have propagated to this closure if called immediately.
            // But since setInterval is async, it should be fine.
            
            // Hacky check: if this node ID was in the last calculation's AP set
            const isCritical = simulatedAPs.has(node.id) || (steps[steps.length-1]?.state.articulationPoints.has(node.id));

            if (isCritical) {
                drain = SENSOR_CONFIG.drainRateAP; // FAST DRAIN
            }
            
            const newEnergy = Math.max(0, node.energy - drain);
            let newStatus: Node['status'] = node.status;

            if (newEnergy <= 0) {
                newStatus = 'dead';
                topologyChanged = true;
            }

            return { ...node, energy: newEnergy, status: newStatus };
        });

        // WAKE UP LOGIC
        // If an Active Node just died (isDead), find its dedicated sleeper (closest sleeping node) and wake it
        prevNodes.forEach((oldNode, idx) => {
            const newNode = newNodes[idx];
            if (oldNode.status === 'active' && newNode.status === 'dead') {
                 // A node just died. Check if it has a sleeper nearby.
                 newNodes.forEach((potentialSleeper, sIdx) => {
                     if (potentialSleeper.status === 'sleeping') {
                         const d = getDistance(newNode, potentialSleeper);
                         if (d < 60) { // Very close (our spawn distance is 30)
                             // Wake up!
                             newNodes[sIdx] = { ...potentialSleeper, status: 'active', energy: 100 };
                             topologyChanged = true;
                         }
                     }
                 });
            }
        });

        // If topology changed, we need to update links.
        // We do this in a useEffect to allow visual "lag" if desired, 
        // but here we set a trigger.
        return newNodes;
    });
  };

  // Listen for topology changes to Recalculate Links
  // This effectively handles the "Restructure" phase
  useEffect(() => {
     if (isSimulating) {
         // Create a small delay to simulate "Re-structuring" slowly
         const handle = setTimeout(() => {
             const newLinks = recalculateLinksBasedOnRange(nodes);
             setLinks(newLinks);
             refreshAlgorithm(nodes, newLinks);
         }, 800); // 800ms delay to make the connection change visible
         return () => clearTimeout(handle);
     }
  }, [nodes]); 

  // --- Algo Controls ---
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
    setIsFixed(false);
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
  const isFinished = currentStepIndex >= steps.length - 1;
  const hasAPs = currentStep ? currentStep.state.articulationPoints.size > 0 : false;

  return (
    <div className={`flex flex-col lg:flex-row h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans ${lang === 'ar' ? 'lg:flex-row-reverse' : ''}`}>
      
      {/* Control Panel */}
      <ControlPanel 
        currentStep={currentStep}
        totalSteps={steps.length}
        currentStepIndex={currentStepIndex}
        isPlaying={isPlaying}
        isSimulating={isSimulating}
        isFinished={isFinished}
        hasAPs={hasAPs}
        isFixed={isFixed}
        lang={lang}
        onNext={nextStep}
        onPrev={prevStep}
        onPlay={togglePlay}
        onPause={togglePlay}
        onSimulate={toggleSimulation}
        onStopSim={toggleSimulation}
        onReset={initialize}
        onFix={handleFixNetwork}
        onLanguageToggle={() => setLang(l => l === 'en' ? 'ar' : 'en')}
        onFileUpload={handleFileUpload}
      />

      {/* Graph Area */}
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
