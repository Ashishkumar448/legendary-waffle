"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2, ShieldCheck, AlertTriangle, Info, Search } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const [ioc, setIoc] = useState("");
  const [type, setType] = useState("domain");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ioc) return;
    
    setLoading(true);
    setError("");
    setResults(null);

    try {
      // Pass the user's token so the backend can verify and save to DB
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post("/api/enrich", { ioc, type }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setResults(response.data.results);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred during enrichment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Manual IOC Submission</h1>
        <p className="text-zinc-400 mt-1">Submit a domain, IP, hash, or URL for deep enrichment and analysis.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={ioc}
                onChange={(e) => setIoc(e.target.value)}
                placeholder="Enter indicator (e.g., evil.com, 8.8.8.8)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white"
                required
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white appearance-none"
            >
              <option value="domain">Domain</option>
              <option value="ip">IP Address</option>
              <option value="hash">File Hash</option>
              <option value="url">URL</option>
              <option value="email">Email</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-all flex items-center justify-center disabled:opacity-50 min-w-[120px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enrich IOC"}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Enrichment Results</h2>
          {results.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
              No data found for this IOC across configured sources.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="font-medium text-white">{result.source}</span>
                    </div>
                    {result.reputation && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        (result.reputation.malicious > 0 || result.reputation.suspicious > 0) 
                          ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                          : "bg-green-500/10 text-green-400 border border-green-500/20"
                      }`}>
                        Malicious: {result.reputation.malicious || 0}
                      </span>
                    )}
                  </div>
                  <div className="bg-zinc-950 rounded-lg p-3 flex-1 overflow-auto border border-zinc-800/50">
                    <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(result.data, null, 2).slice(0, 500)}
                      {JSON.stringify(result.data).length > 500 && "...\n[Data Truncated]"}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
