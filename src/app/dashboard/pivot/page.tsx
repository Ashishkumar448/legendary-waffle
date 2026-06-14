"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Network, Loader2, MousePointerClick, Search } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96 text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export default function PivotPage() {
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [rootIoc, setRootIoc] = useState("");
  const [rootType, setRootType] = useState("ip");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const fgRef = useRef<any>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById("pivot-container");
      if (container) {
        setDimensions({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    setTimeout(updateDimensions, 100);
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleStartPivot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootIoc) return;
    
    // Reset graph
    const initialNode = { id: rootIoc, name: rootIoc, type: rootType, val: 10, color: '#ef4444' };
    setGraphData({ nodes: [initialNode], links: [] });
    
    await expandNode(initialNode);
  };

  const expandNode = async (node: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pivot?ioc=${node.id}&type=${node.type}`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setGraphData(prev => {
          const newNodes = [...prev.nodes];
          const newLinks = [...prev.links];
          const nodeMap = new Set(newNodes.map(n => n.id));

          data.results.forEach((r: any) => {
            if (!nodeMap.has(r.id)) {
              newNodes.push({ 
                id: r.id, 
                name: r.id, 
                type: r.type, 
                val: 5, 
                color: r.type === 'ip' ? '#3b82f6' : '#8b5cf6' 
              });
              nodeMap.add(r.id);
            }
            // Avoid duplicate links
            const linkExists = newLinks.some(l => 
              (l.source.id === node.id || l.source === node.id) && 
              (l.target.id === r.id || l.target === r.id)
            );
            if (!linkExists) {
              newLinks.push({ source: node.id, target: r.id });
            }
          });

          return { nodes: newNodes, links: newLinks };
        });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to pivot from this node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-none">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Pivot Explorer</h1>
        </div>
        <p className="text-zinc-400 max-w-3xl text-sm mt-2">
          Start from a single Indicator of Compromise (IOC) and live-query OSINT sources to discover linked infrastructure. Click any node to recursively expand the threat graph.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
        <form onSubmit={handleStartPivot} className="flex w-full gap-3">
          <select 
            value={rootType} 
            onChange={(e) => setRootType(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="ip">IP Address</option>
            <option value="domain">Domain</option>
            <option value="hash">File Hash</option>
          </select>
          <input 
            type="text" 
            placeholder="Enter initial IOC to start pivoting..."
            value={rootIoc}
            onChange={(e) => setRootIoc(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-6 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Start Hunt
          </button>
        </form>
      </div>

      <div 
        id="pivot-container" 
        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative flex-1 min-h-[500px]"
      >
        {graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
            <Network className="w-16 h-16 mb-4 opacity-20" />
            <p>Enter an IOC above to begin the investigation.</p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor="color"
            linkColor={() => "rgba(100, 100, 100, 0.2)"}
            backgroundColor="#09090b"
            enableNodeDrag={true}
            onNodeClick={(node: any) => {
              expandNode(node);
            }}
            nodeCanvasObjectMode={() => "after"}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              
              if (globalScale > 0.8) {
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = "#a1a1aa";
                ctx.fillText(label, node.x, node.y + node.val + (fontSize * 1.5));
              }
            }}
          />
        )}
        
        {/* Legend */}
        {graphData.nodes.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-4 rounded-xl text-sm shadow-lg pointer-events-none">
            <h3 className="font-semibold text-zinc-100 mb-2">Node Types</h3>
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> IP Address
            </div>
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span> Domain
            </div>
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> Root Node
            </div>
            <div className="flex items-center gap-2 text-red-400 text-xs mt-2 font-medium">
              <MousePointerClick className="w-3 h-3" /> Click any node to pivot!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
