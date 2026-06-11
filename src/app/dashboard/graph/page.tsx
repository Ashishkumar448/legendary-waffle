"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import dynamic from "next/dynamic";
import { Network, Loader2, MousePointerClick, ZoomIn, ZoomOut, Maximize, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

// Dynamically import to disable SSR since ForceGraph needs the browser window/canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96 text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export default function GraphPage() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [rotation, setRotation] = useState(0);
  
  // Search and Highlight State
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState<Set<any>>(new Set<any>());
  const [searchedNode, setSearchedNode] = useState<any>(null);

  const fgRef = useRef<any>(null);

  useEffect(() => {
    // Resize graph to fit container dynamically
    const updateDimensions = () => {
      const container = document.getElementById("graph-container");
      if (container) {
        setDimensions({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    
    // Initial size
    setTimeout(updateDimensions, 100);
    // Extra safety update after rendering
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

        // We use maps to avoid duplicate nodes
        const iocMap = new Map();

        allDocs.forEach((doc) => {
          const event = doc.data();
          const eventId = doc.id;

          // Add Campaign Node (Red)
          nodes.push({
            id: eventId,
            name: event.eventName,
            type: "campaign",
            group: 1,
            val: 20 // Size
          });

          // Add IOC Nodes (Blue) and Links
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
                  val: 5 // Size
                });
              }

              // Create Link from Campaign to IOC
              links.push({
                source: eventId,
                target: iocValue,
                value: 1
              });
            });
          }
        });

        // Calculate node degrees for dynamic sizing
        const degreeCount: Record<string, number> = {};
        links.forEach(link => {
          degreeCount[link.source] = (degreeCount[link.source] || 0) + 1;
          degreeCount[link.target] = (degreeCount[link.target] || 0) + 1;
        });

        nodes.forEach(node => {
          const degree = degreeCount[node.id] || 0;
          if (node.type === "campaign") {
            // Drastically smaller red nodes
            node.val = Math.max(3, Math.min(8, 3 + Math.log2(degree + 1)));
          } else {
            // Smaller blue nodes
            node.val = Math.max(1.5, Math.min(4, 1.5 + Math.log2(degree + 1) * 0.5));
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

  // Handle Search Highlighting
  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setSearchedNode(null);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matchedNode = graphData.nodes.find((n: any) => 
      String(n.id).toLowerCase().includes(query) || (n.name && String(n.name).toLowerCase().includes(query))
    );

    if (matchedNode) {
      setSearchedNode(matchedNode);
      const newHighlightNodes = new Set<string>();
      const newHighlightLinks = new Set<any>();

      newHighlightNodes.add(matchedNode.id);

      graphData.links.forEach((link: any) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (sourceId === matchedNode.id || targetId === matchedNode.id) {
          newHighlightLinks.add(link);
          newHighlightNodes.add(sourceId);
          newHighlightNodes.add(targetId);
        }
      });

      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
      
      // Auto center to searched node
      if (fgRef.current && matchedNode.x !== undefined && matchedNode.y !== undefined) {
        // fgRef.current.centerAt(matchedNode.x, matchedNode.y, 1000);
      }
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setSearchedNode(null);
    }
  }, [searchQuery, graphData]);

  // Configure custom physics forces when graph data loads
  useEffect(() => {
    if (fgRef.current && !loading) {
      // Strong repulsion to spread nodes out fully across the wide screen
      fgRef.current.d3Force('charge').strength(-300);
      // Longer links to allow the graph to expand outward
      fgRef.current.d3Force('link').distance(70);
      
      // Gentle gravity to keep isolated nodes from floating into the abyss
      fgRef.current.d3Force('x', fgRef.current.d3Force('x') || (window as any).d3?.forceX(0).strength(0.01) || null);
      fgRef.current.d3Force('y', fgRef.current.d3Force('y') || (window as any).d3?.forceY(0).strength(0.01) || null);
    }
  }, [graphData, loading]);

  // Graph Controls Functions
  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.5, 400);
  };
  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.5, 400);
  };
  const handleReset = () => {
    if (fgRef.current) fgRef.current.zoomToFit(500, 50);
    setRotation(0);
  };
  const handlePan = (dx: number, dy: number) => {
    if (fgRef.current) {
      // Adjust pan direction if rotated to keep controls intuitive
      const rad = (rotation * Math.PI) / 180;
      const adjustedDx = dx * Math.cos(rad) + dy * Math.sin(rad);
      const adjustedDy = -dx * Math.sin(rad) + dy * Math.cos(rad);
      
      const currentCenter = fgRef.current.centerAt();
      fgRef.current.centerAt(currentCenter.x + adjustedDx, currentCenter.y + adjustedDy, 400);
    }
  };
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  if (loading) return <div className="text-zinc-500 flex justify-center py-20">Loading correlation web...</div>;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-none">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Threat Investigation Graph</h1>
        </div>
        <div className="flex justify-between items-start mt-2">
          <p className="text-zinc-400 max-w-3xl text-sm">
            Visualize cross-organizational intelligence. Red nodes represent Campaigns, Blue nodes represent IOCs. If multiple campaigns connect to the same node, it indicates highly correlated threat activity. Hover for details.
          </p>
          <div className="flex items-center gap-2 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full">
            <MousePointerClick className="w-3 h-3" /> Click a Red Campaign node to view details
          </div>
        </div>
      </div>

      <div 
        id="graph-container" 
        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative"
        style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}
      >
        <div style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.5s ease', width: '100%', height: '100%' }}>
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name" // Native tooltip on hover
          linkColor={(link: any) => {
            if (highlightLinks.size === 0) return "#27272a"; // default zinc-800
            return highlightLinks.has(link) ? "#fbbf24" : "rgba(100, 100, 100, 0.05)";
          }}
          linkWidth={(link: any) => highlightLinks.has(link) ? 2 : 1}
          backgroundColor="#09090b" // zinc-950
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          d3VelocityDecay={0.3} // Better drag feel
          cooldownTicks={100} // Stabilizes faster
          onEngineStop={() => {
            if (fgRef.current) {
              fgRef.current.zoomToFit(600, 50); // Auto-center and fit to screen
            }
          }}
          onNodeClick={(node: any) => {
            if (node.type === "campaign") {
              router.push(`/dashboard/events/${node.id}`);
            } else {
              const dummy = document.createElement("input");
              document.body.appendChild(dummy);
              dummy.value = node.id;
              dummy.select();
              document.execCommand("copy");
              document.body.removeChild(dummy);
              alert(`Copied IOC to clipboard: ${node.id}`);
            }
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            if (!node || !node.name) return;
            // Shorten label to just 1 word + ...
            const words = String(node.name).split(/[ \-\.]/);
            const label = words.length > 0 ? words[0].substring(0, 10) + "..." : "...";
            
            const fontSize = Math.max(10 / globalScale, 2); // Minimum font size
            
            // Only draw text if zoomed in enough
            const shouldDrawText = globalScale > 0.8;

            const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
            const isSearched = searchedNode && searchedNode.id === node.id;
            
            // Special highlight: if an IOC was searched, highlight the campaigns connected to it in orange
            const isConnectedToSearchedIOC = searchedNode && searchedNode.type !== "campaign" && node.type === "campaign" && highlightNodes.has(node.id);

            // Determine color
            let color = node.type === "campaign" ? "#ef4444" : "#3b82f6";
            if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) {
              color = "rgba(100, 100, 100, 0.1)"; // Faded out
            } else if (isSearched) {
              color = "#fbbf24"; // Bright Amber for the exact match
            } else if (isConnectedToSearchedIOC) {
              color = "#f97316"; // Bright Orange for the special campaign highlight
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fill();

            // Glow effect
            if (isSearched || isConnectedToSearchedIOC) {
              ctx.strokeStyle = color;
              ctx.lineWidth = 4 / globalScale;
              ctx.stroke();
            }

            if (shouldDrawText && isHighlighted) {
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = (isSearched || isConnectedToSearchedIOC) ? "#fbbf24" : "#a1a1aa";
              ctx.fillText(label, node.x, node.y + node.val + (fontSize * 1.5));
            }
          }}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            // Perfectly aligns the physical drag/click hitbox with our custom drawn circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
        />
        </div>
        
        {/* Legend */}
        <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-4 rounded-xl text-sm shadow-lg pointer-events-none">
          <h3 className="font-semibold text-zinc-100 mb-2">Legend</h3>
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Threat Campaign
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Indicator (IOC)
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-3 rounded-xl shadow-lg z-10 w-72">
          <input 
            type="text" 
            placeholder="Search IOC or Event..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        {/* Graph Controls Overlay */}
        <div className="absolute bottom-6 right-6 flex items-end gap-4">
          
          {/* Pan Controls */}
          <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl p-2 shadow-lg grid grid-cols-3 grid-rows-3 gap-1 w-24 h-24">
            <div className="col-start-2">
              <button onClick={() => handlePan(0, -150)} className="w-full h-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors" title="Pan Up">
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
            <div className="col-start-1 row-start-2">
              <button onClick={() => handlePan(-150, 0)} className="w-full h-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors" title="Pan Left">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="col-start-2 row-start-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
            </div>
            <div className="col-start-3 row-start-2">
              <button onClick={() => handlePan(150, 0)} className="w-full h-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors" title="Pan Right">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="col-start-2 row-start-3">
              <button onClick={() => handlePan(0, 150)} className="w-full h-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors" title="Pan Down">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Controls */}
          <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
            <button onClick={handleZoomIn} className="p-3 hover:bg-zinc-800 text-zinc-300 transition-colors border-b border-zinc-800" title="Zoom In">
              <ZoomIn className="w-5 h-5" />
            </button>
            <button onClick={handleReset} className="p-3 hover:bg-zinc-800 text-blue-400 transition-colors border-b border-zinc-800" title="Reset & Fit to Screen">
              <Maximize className="w-5 h-5" />
            </button>
            <button onClick={handleRotate} className="p-3 hover:bg-zinc-800 text-zinc-300 transition-colors border-b border-zinc-800" title="Rotate 90°">
              <RotateCw className="w-5 h-5" />
            </button>
            <button onClick={handleZoomOut} className="p-3 hover:bg-zinc-800 text-zinc-300 transition-colors" title="Zoom Out">
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
}
