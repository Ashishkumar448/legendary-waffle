"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { Ghost, Loader2, Users, Target, ShieldAlert, FileText } from "lucide-react";
import PageHelp from "@/components/PageHelp";

export default function ActorsPage() {
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActors() {
      try {
        const q = query(collection(db, "threat_actors"));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          // Fallback static data if db is empty
          setActors([
            { id: "1", name: "Lazarus Group", aliases: ["HIDDEN COBRA", "Guardians of Peace"], origin: "North Korea", targetSectors: ["Finance", "Crypto", "Aerospace"], description: "A highly prolific cyber threat group attributed to the North Korean government." },
            { id: "2", name: "Fancy Bear", aliases: ["APT28", "Sofacy", "Iron Twilight"], origin: "Russia", targetSectors: ["Government", "Military", "Media"], description: "Russian military intelligence (GRU) cyber operations group." },
            { id: "3", name: "Equation Group", aliases: ["Shadow Brokers associated"], origin: "United States", targetSectors: ["Telecom", "Government", "Energy"], description: "A highly sophisticated threat actor widely suspected of being tied to the NSA." }
          ]);
        } else {
          setActors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Failed to fetch actors", err);
      } finally {
        setLoading(false);
      }
    }
    fetchActors();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Ghost className="w-8 h-8 text-indigo-500" />
            Threat Actor Profiles
            <PageHelp 
              title="Threat Actors" 
              description="This directory catalogs known Advanced Persistent Threats (APTs) and cybercriminal syndicates. You can view their common aliases, geographic origins, typical target sectors, and TTPs. These profiles are continuously updated via threat intelligence feeds." 
            />
          </h1>
          <p className="text-zinc-400 mt-2">
            Intelligence profiles of APTs, ransomware gangs, and state-sponsored groups.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {actors.map(actor => (
            <div key={actor.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <Ghost className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{actor.name}</h2>
                    <p className="text-xs text-zinc-500 font-mono mt-1">Origin: {actor.origin || "Unknown"}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {actor.description}
              </p>

              <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-400" /> Known Aliases
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(actor.aliases || []).map((alias: string) => (
                      <span key={alias} className="bg-zinc-950 text-zinc-300 text-xs px-3 py-1 rounded-md border border-zinc-800">
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-400" /> Target Sectors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(actor.targetSectors || []).map((sector: string) => (
                      <span key={sector} className="bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-md border border-red-500/20">
                        {sector}
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
