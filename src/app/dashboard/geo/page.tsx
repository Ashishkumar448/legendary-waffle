"use client";

import { Map, Loader2, Globe } from "lucide-react";
import PageHelp from "@/components/PageHelp";
import { useEffect, useState } from "react";

export default function GeoPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading the map library
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 h-screen flex flex-col">
      <div className="border-b border-zinc-800 pb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Map className="w-8 h-8 text-indigo-500" />
            Geo Heatmap
            <PageHelp 
              title="Geo Heatmap" 
              description="This visual map plots the physical geolocation data of IP addresses associated with your active Threat Campaigns. Darker red zones indicate a higher concentration of malicious infrastructure." 
            />
          </h1>
          <p className="text-zinc-400 mt-2">
            Global geographic distribution of malicious IP infrastructure.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex-1 relative overflow-hidden shadow-xl min-h-[500px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-zinc-400 font-medium">Initializing Map Engine...</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0c] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-[#0a0a0c]">
            {/* Mock map visualization since we don't have leaflet installed */}
            <div className="relative w-full h-full opacity-60 flex items-center justify-center">
              <Globe className="w-[800px] h-[800px] text-zinc-800 animate-pulse stroke-[0.5]" />
              
              {/* Mock Hotspots */}
              <div className="absolute top-[30%] left-[25%] w-8 h-8 bg-red-500/50 rounded-full blur-md animate-pulse"></div>
              <div className="absolute top-[30%] left-[25%] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)]"></div>

              <div className="absolute top-[40%] left-[65%] w-12 h-12 bg-red-500/40 rounded-full blur-xl animate-pulse delay-75"></div>
              <div className="absolute top-[40%] left-[65%] w-4 h-4 bg-red-500 rounded-full shadow-[0_0_25px_rgba(239,68,68,1)]"></div>

              <div className="absolute top-[20%] left-[55%] w-6 h-6 bg-amber-500/50 rounded-full blur-md animate-pulse delay-150"></div>
              <div className="absolute top-[20%] left-[55%] w-2 h-2 bg-amber-500 rounded-full"></div>
            </div>

            <div className="absolute bottom-6 right-6 bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-2xl">
              <h4 className="text-white font-bold text-sm mb-3">Top Regions</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-6 text-xs">
                  <span className="text-zinc-400">Eastern Europe</span>
                  <span className="text-red-400 font-bold">142 IPs</span>
                </div>
                <div className="flex items-center justify-between gap-6 text-xs">
                  <span className="text-zinc-400">North America</span>
                  <span className="text-amber-400 font-bold">89 IPs</span>
                </div>
                <div className="flex items-center justify-between gap-6 text-xs">
                  <span className="text-zinc-400">East Asia</span>
                  <span className="text-amber-400 font-bold">54 IPs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
