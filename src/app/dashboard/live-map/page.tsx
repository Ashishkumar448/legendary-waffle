"use client";

import { Activity } from "lucide-react";

export default function LiveMapPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Activity className="w-5 h-5 text-red-500 animate-pulse" />
        <h1 className="text-xl font-bold tracking-tight text-white">Live Threat Map</h1>
      </div>
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
        <iframe
          src="https://threatmap.checkpoint.com/"
          className="absolute inset-0 w-full h-full border-0"
          title="Live Threat Visualization"
          allowFullScreen
        />
      </div>
    </div>
  );
}
