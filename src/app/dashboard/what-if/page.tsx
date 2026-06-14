"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import dynamic from "next/dynamic";
import { Play, Square, Settings2, ShieldAlert, Loader2, MousePointerClick, RotateCcw } from "lucide-react";
import { auth, db } from "@/lib/firebase";

// Dynamically import to disable SSR since ForceGraph needs the browser window/canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96 text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export default function WhatIfPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Simulation State
  const [patientZero, setPatientZero] = useState<string | null>(null);
  const [infectedNodes, setInfectedNodes] = useState<Set<string>>(new Set<string>());
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [infectionRate, setInfectionRate] = useState<number>(50); // 0 to 100%
  const [tickCount, setTickCount] = useState(0);

  const fgRef = useRef<any>(null);
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Resize graph to fit container dynamically
    const updateDimensions = () => {
      const container = document.getElementById("graph-container");
      if (container) {
        setDimensions({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    
    setTimeout(updateDimensions, 100);
    setTimeout(updateDimensions, 1000);
    
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!auth.currentUser) return;
        
        // Fetch User Org
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;

        // Fetch Global and Org Events
        const qGlobal = query(collection(db, "threatEvents"), where("isPublic", "==", true));
        const globalSnap = await getDocs(qGlobal);
        
        let orgDocs: any[] = [];
        if (orgId) {
          const qOrg = query(collection(db, "threatEvents"), where("organizationId", "==", orgId));
          const orgSnap = await getDocs(qOrg);
          orgDocs = orgSnap.docs;
        }

        const dataMap = new Map();
        globalSnap.docs.forEach((d) => dataMap.set(d.id, d));
        orgDocs.forEach((d) => dataMap.set(d.id, d));

        const allDocs = Array.from(dataMap.values());

        const nodes: any[] = [];
        const links: any[] = [];
        const iocMap = new Map();

        allDocs.forEach((doc) => {
          const event = doc.data();
          const eventId = doc.id;

          // Add Campaign Node
          nodes.push({
            id: eventId,
            name: event.eventName,
            type: "campaign",
            group: 1,
            val: 12
          });

          // Add IOC Nodes
          if (event.events && Array.isArray(event.events)) {
            event.events.forEach((ioc: any) => {
              const iocValue = ioc.ioc || ioc.value;
              if (!iocValue) return;

              if (!iocMap.has(iocValue)) {
                iocMap.set(iocValue, true);
                nodes.push({
                  id: iocValue,
                  name: iocValue,
                  type: ioc.type || "ioc",
                  group: 2,
                  val: 6
                });
              }

              // Create Link
              links.push({
                source: eventId,
                target: iocValue,
                value: 1
              });
            });
          }
        });

        // Calculate degrees
        const degreeCount: Record<string, number> = {};
        links.forEach(link => {
          degreeCount[link.source] = (degreeCount[link.source] || 0) + 1;
          degreeCount[link.target] = (degreeCount[link.target] || 0) + 1;
        });

        nodes.forEach(node => {
          const degree = degreeCount[node.id] || 0;
          if (node.type === "campaign") {
            node.val = Math.max(8, Math.min(20, 8 + degree * 1.5));
          } else {
            node.val = Math.max(4, Math.min(12, 4 + degree));
          }
        });

        setGraphData({ nodes, links } as any);
      } catch (err) {
        console.error("Error fetching graph data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Configure custom physics
  useEffect(() => {
    if (fgRef.current && !loading) {
      fgRef.current.d3Force('charge').strength(-400);
      fgRef.current.d3Force('link').distance(80);
      fgRef.current.d3Force('x', fgRef.current.d3Force('x') || (window as any).d3?.forceX(0).strength(0.02) || null);
      fgRef.current.d3Force('y', fgRef.current.d3Force('y') || (window as any).d3?.forceY(0).strength(0.02) || null);
    }
  }, [graphData, loading]);

  // Simulation Logic
  const runSimulationTick = useCallback(() => {
    setInfectedNodes(prev => {
      const newInfected = new Set(prev);
      let spreadOccurred = false;

      // Find neighbors of currently infected nodes
      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        const sourceInfected = newInfected.has(sourceId);
        const targetInfected = newInfected.has(targetId);

        if (sourceInfected && !targetInfected) {
          if (Math.random() * 100 <= infectionRate) {
            newInfected.add(targetId);
            spreadOccurred = true;
          }
        } else if (!sourceInfected && targetInfected) {
          if (Math.random() * 100 <= infectionRate) {
            newInfected.add(sourceId);
            spreadOccurred = true;
          }
        }
      });

      if (!spreadOccurred) {
        // If no spread happened, stop simulation
        setSimulationRunning(false);
      }
      return newInfected;
    });
    setTickCount(prev => prev + 1);
  }, [graphData.links, infectionRate]);

  useEffect(() => {
    if (simulationRunning) {
      simulationInterval.current = setInterval(runSimulationTick, 1000);
    } else if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
    }
    return () => {
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    };
  }, [simulationRunning, runSimulationTick]);

  const toggleSimulation = () => {
    if (!patientZero) {
      alert("Please select a 'Patient Zero' by clicking a node on the graph first.");
      return;
    }
    setSimulationRunning(!simulationRunning);
  };

  const resetSimulation = () => {
    setSimulationRunning(false);
    setInfectedNodes(new Set());
    setPatientZero(null);
    setTickCount(0);
  };

  const handleNodeClick = (node: any) => {
    if (simulationRunning) return; // Prevent changing during run

    if (patientZero === node.id) {
      setPatientZero(null);
      setInfectedNodes(new Set());
    } else {
      setPatientZero(node.id);
      const initialSet = new Set<string>();
      initialSet.add(node.id);
      setInfectedNodes(initialSet);
      setTickCount(0);
    }
  };

  if (loading) return <div className="text-zinc-500 flex justify-center py-20">Loading what-if sandbox...</div>;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 pb-6">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 flex-none space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">What-If Sandbox</h1>
          </div>
          <p className="text-zinc-400 mt-2 text-sm">
            Simulate lateral movement. Select a compromised node to predict the blast radius across campaigns.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-zinc-400" />
              Simulation Controls
            </h3>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full border border-zinc-700">Tick: {tickCount}</span>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300 block">
              Infection Rate: {infectionRate}%
            </label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={infectionRate} 
              onChange={(e) => setInfectionRate(Number(e.target.value))}
              disabled={simulationRunning}
              className="w-full accent-red-500 bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-zinc-500">Probability of threat spreading to connected nodes per tick.</p>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-3">
            {!patientZero && (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                <MousePointerClick className="w-4 h-4 flex-none" />
                Click any node on the graph to set Patient Zero.
              </div>
            )}

            {patientZero && (
              <div className="text-sm text-zinc-300 bg-zinc-800 p-3 rounded-lg border border-zinc-700 truncate">
                <span className="text-zinc-500 block text-xs uppercase mb-1">Patient Zero</span>
                {patientZero}
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={toggleSimulation}
                disabled={!patientZero}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                  simulationRunning 
                  ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700' 
                  : 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {simulationRunning ? (
                  <><Square className="w-4 h-4" /> Pause</>
                ) : (
                  <><Play className="w-4 h-4" /> Start</>
                )}
              </button>

              <button 
                onClick={resetSimulation}
                className="p-2.5 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 rounded-lg border border-zinc-700 transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
           <h3 className="font-semibold text-zinc-100 mb-4 text-sm uppercase tracking-wider text-zinc-500">Stats</h3>
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-center">
                <div className="text-2xl font-bold text-zinc-100">{graphData.nodes.length}</div>
                <div className="text-xs text-zinc-500 mt-1">Total Nodes</div>
             </div>
             <div className="bg-zinc-950 p-3 rounded-xl border border-red-500/30 text-center shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]">
                <div className="text-2xl font-bold text-red-500">{infectedNodes.size}</div>
                <div className="text-xs text-red-400/70 mt-1">Infected</div>
             </div>
           </div>
        </div>
      </div>

      {/* Main Graph Area */}
      <div 
        id="graph-container" 
        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[500px]"
      >
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          linkColor={(link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (infectedNodes.has(sourceId) && infectedNodes.has(targetId)) {
              return "#ef4444"; // Red for infected links
            }
            return "rgba(100, 100, 100, 0.1)"; // default
          }}
          linkWidth={(link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return (infectedNodes.has(sourceId) && infectedNodes.has(targetId)) ? 2 : 1;
          }}
          backgroundColor="#09090b" // zinc-950
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          d3VelocityDecay={0.3}
          cooldownTicks={100}
          onEngineStop={() => {
            if (fgRef.current && tickCount === 0) {
              fgRef.current.zoomToFit(600, 50);
            }
          }}
          onNodeClick={handleNodeClick}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            if (!node || !node.name) return;
            
            const isInfected = infectedNodes.has(node.id);
            const isPatientZero = patientZero === node.id;

            // Determine color
            let color = node.type === "campaign" ? "#3f3f46" : "#27272a"; // default grayish
            if (isInfected) {
              color = node.type === "campaign" ? "#ef4444" : "#f97316"; // Red campaign, Orange IOC
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fill();

            // Glow/Stroke effect for infected or patient zero
            if (isInfected) {
              ctx.strokeStyle = isPatientZero ? "#ffffff" : color;
              ctx.lineWidth = isPatientZero ? (6 / globalScale) : (3 / globalScale);
              ctx.stroke();

              // Add a larger semi-transparent glow
              ctx.fillStyle = isPatientZero ? "rgba(255,255,255,0.1)" : "rgba(239, 68, 68, 0.2)";
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val * 1.5, 0, 2 * Math.PI, false);
              ctx.fill();
            }

            // Draw label if zoomed in enough or infected
            const shouldDrawText = globalScale > 1.2 || isPatientZero;
            if (shouldDrawText) {
              const words = String(node.name).split(/[ \-\.]/);
              const label = words.length > 0 ? words[0].substring(0, 10) + (words[0].length > 10 ? "..." : "") : "...";
              const fontSize = Math.max(10 / globalScale, 2);
              
              ctx.font = `${isPatientZero ? 'bold' : ''} ${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = isInfected ? "#fca5a5" : "#a1a1aa";
              ctx.fillText(label, node.x, node.y + node.val + (fontSize * 1.5));
            }
          }}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val * 1.2, 0, 2 * Math.PI, false); // Slightly larger click area
            ctx.fill();
          }}
        />
        
        {/* Legend Overlay inside graph */}
        <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-4 rounded-xl text-sm shadow-lg pointer-events-none">
          <h3 className="font-semibold text-zinc-100 mb-2">Legend</h3>
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <span className="w-3 h-3 rounded-full bg-zinc-700"></span> Uninfected Node
          </div>
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> Infected Campaign
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span> Infected IOC
          </div>
        </div>
      </div>
    </div>
  );
}
