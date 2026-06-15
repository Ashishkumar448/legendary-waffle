"use client";

import { useState } from "react";
import { GitCompare, Search, Loader2, Database, ShieldAlert, Zap } from "lucide-react";
import PageHelp from "@/components/PageHelp";

export default function ComparePage() {
  const [ioc1, setIoc1] = useState("");
  const [ioc2, setIoc2] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleCompare = () => {
    if (!ioc1 || !ioc2) return;
    setLoading(true);
    
    // Simulate an API call to fetch IOC data and compute differences
    setTimeout(() => {
      setResults({
        ioc1: {
          value: ioc1,
          type: ioc1.match(/[a-zA-Z]/) ? "Domain" : "IP",
          riskScore: Math.floor(Math.random() * 100),
          vendors: ["VirusTotal", "AlienVault"],
          tags: ["botnet", "c2", "malware"]
        },
        ioc2: {
          value: ioc2,
          type: ioc2.match(/[a-zA-Z]/) ? "Domain" : "IP",
          riskScore: Math.floor(Math.random() * 100),
          vendors: ["VirusTotal", "AbuseIPDB"],
          tags: ["phishing", "spam"]
        }
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <GitCompare className="w-8 h-8 text-indigo-500" />
            IOC Comparison
            <PageHelp title="IOC Comparison" description="Enter two different Indicators of Compromise (IPs, domains, hashes) to compare their known threat actors, risk scores, and MITRE ATT&CK tags side-by-side." />
          </h1>
          <p className="text-zinc-400 mt-2">
            Run a side-by-side behavioral and attribution comparison between two indicators.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="First Indicator (e.g. 1.1.1.1)"
            value={ioc1}
            onChange={e => setIoc1(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <div className="bg-zinc-800 text-zinc-400 p-3 rounded-full hidden md:block">
          <GitCompare className="w-5 h-5" />
        </div>

        <div className="flex-1 w-full relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Second Indicator (e.g. 8.8.8.8)"
            value={ioc2}
            onChange={e => setIoc2(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button 
          onClick={handleCompare}
          disabled={!ioc1 || !ioc2 || loading}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Compare"}
        </button>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-in fade-in slide-in-from-bottom-4">
          {[results.ioc1, results.ioc2].map((res, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-zinc-950 p-6 border-b border-zinc-800 text-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{res.type}</span>
                <h2 className="text-2xl font-mono font-bold text-white mt-1">{res.value}</h2>
              </div>
              <div className="p-6 space-y-6">
                
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" /> Risk Score
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-full bg-zinc-950 rounded-full h-4 overflow-hidden border border-zinc-800">
                      <div 
                        className={`h-full ${res.riskScore > 75 ? 'bg-red-500' : res.riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${res.riskScore}%` }}
                      />
                    </div>
                    <span className="font-bold text-white w-10 text-right">{res.riskScore}/100</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" /> Enrichment Sources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {res.vendors.map((v: string) => (
                      <span key={v} className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full border border-zinc-700">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> Intelligence Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {res.tags.map((t: string) => (
                      <span key={t} className="bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1 rounded border border-indigo-500/20 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
