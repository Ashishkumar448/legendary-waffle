"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import dynamic from "next/dynamic";
import { Network, Loader2, MousePointerClick } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

// Dynamically import to disable SSR since ForceGraph needs the browser window/canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center h-96 text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export default function GraphPage() {
  const router = useRouter();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
          // Base size + bonus for connections
          node.val = (node.type === "campaign" ? 8 : 3) + Math.min((degreeCount[node.id] || 0) * 1.5, 30);
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

  if (loading) return <div className="text-zinc-500">Loading correlation web...</div>;

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
        className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative"
      >
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name" // Native tooltip on hover
          nodeColor={(node: any) => node.type === "campaign" ? "#ef4444" : "#3b82f6"}
          linkColor={() => "#27272a"} // zinc-800
          linkWidth={1}
          nodeRelSize={4}
          backgroundColor="#09090b" // zinc-950
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
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

            ctx.fillStyle = node.type === "campaign" ? "#ef4444" : "#3b82f6";
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fill();

            if (shouldDrawText) {
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = "#a1a1aa"; // zinc-400
              ctx.fillText(label, node.x, node.y + node.val + (fontSize * 1.5));
            }
          }}
        />
        
        <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-4 rounded-xl text-sm shadow-lg pointer-events-none">
          <h3 className="font-semibold text-zinc-100 mb-2">Legend</h3>
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Threat Campaign
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Indicator (IOC)
          </div>
        </div>
      </div>
    </div>
  );
}
