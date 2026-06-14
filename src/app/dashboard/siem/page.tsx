"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, where, getDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { ShieldAlert, Activity, Server, Lock, AlertTriangle, ShieldCheck, Terminal, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type DefensePush = {
  id: string;
  ioc: string;
  type: string;
  campaignId: string;
  campaignName: string;
  pushedBy: string;
  timestamp: string;
  status: string;
  destination: string;
};

export default function SiemDashboardPage() {
  const [pushes, setPushes] = useState<DefensePush[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function setupSiem() {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const orgId = userDoc.data()?.organizationId;

      if (!orgId) return;

      const q = query(
        collection(db, "defense_pushes"),
        where("organizationId", "==", orgId),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs: DefensePush[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() } as DefensePush);
        });
        setPushes(logs);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching defense pushes:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }

    setupSiem();
  }, []);

  const uniqueCampaigns = new Set(pushes.map(p => p.campaignId)).size;
  const uniqueIOCs = new Set(pushes.map(p => p.ioc)).size;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 space-y-4 flex-col text-green-500 font-mono">
        <Activity className="w-10 h-10 animate-pulse" />
        <p>INITIALIZING SOC DASHBOARD...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-green-900/30 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-green-500 flex items-center gap-3 uppercase">
            <Server className="w-8 h-8" />
            Active Defense SIEM
          </h1>
          <p className="text-green-600/70 mt-2 max-w-2xl text-sm">
            Live telemetry of indicators blocked at the perimeter. Monitored directly from Firebase `defense_pushes` collection.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-950/50 border border-green-500/20 px-4 py-2 rounded-lg text-green-500 text-sm animate-pulse">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          Perimeter Status: SECURE
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-950 border border-green-900/50 p-6 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.05)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="w-16 h-16 text-green-500" />
          </div>
          <div className="text-green-600/70 text-sm font-semibold mb-2 uppercase">Total Blocks</div>
          <div className="text-4xl font-bold text-green-500">{pushes.length}</div>
          <div className="text-xs text-green-600/50 mt-2">Active firewall rules deployed</div>
        </div>

        <div className="bg-zinc-950 border border-green-900/50 p-6 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.05)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-16 h-16 text-green-500" />
          </div>
          <div className="text-green-600/70 text-sm font-semibold mb-2 uppercase">Unique Indicators</div>
          <div className="text-4xl font-bold text-green-500">{uniqueIOCs}</div>
          <div className="text-xs text-green-600/50 mt-2">Distinct IOCs neutralized</div>
        </div>

        <div className="bg-zinc-950 border border-green-900/50 p-6 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.05)]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="w-16 h-16 text-green-500" />
          </div>
          <div className="text-green-600/70 text-sm font-semibold mb-2 uppercase">Campaigns Mitigated</div>
          <div className="text-4xl font-bold text-green-500">{uniqueCampaigns}</div>
          <div className="text-xs text-green-600/50 mt-2">Correlated threat events affected</div>
        </div>
      </div>

      {/* Main Grid: Terminal + Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Terminal Visualizer (Left Col) */}
        <div className="lg:col-span-1 bg-black border border-green-900/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
          <div className="bg-zinc-900 border-b border-green-900/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600/70 text-xs">
              <Terminal className="w-4 h-4" />
              FIREWALL_SYSLOG
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-y-auto text-xs text-green-500 leading-relaxed space-y-2 opacity-80">
            {pushes.length === 0 ? (
              <div className="text-green-600/50">Waiting for defensive push events...</div>
            ) : (
              pushes.map((p, i) => (
                <div key={`term-${i}`} className="border-l-2 border-green-900/50 pl-2">
                  <span className="text-green-600/50">[{format(new Date(p.timestamp), "HH:mm:ss")}]</span> 
                  <span className="text-yellow-500 ml-2">RULE_ADD</span>: 
                  BLOCK {p.type.toUpperCase()} {p.ioc}
                  <br />
                  <span className="text-green-700">src=iocag dest=fw1 status=ok</span>
                </div>
              ))
            )}
            <div className="animate-pulse inline-block w-2 h-4 bg-green-500 mt-2"></div>
          </div>
        </div>

        {/* Ledger Table (Right Col) */}
        <div className="lg:col-span-2 bg-zinc-950 border border-green-900/50 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
          <div className="bg-zinc-900 border-b border-green-900/50 p-4">
            <h3 className="text-green-500 font-semibold text-sm uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Active Blocklist Ledger
            </h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-green-600/70 uppercase bg-zinc-900/50 sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-semibold">Indicator</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Source Campaign</th>
                  <th className="px-6 py-4 font-semibold text-right">Time Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-900/20">
                {pushes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-green-600/50">
                      No indicators have been pushed to defense yet.
                    </td>
                  </tr>
                ) : (
                  pushes.map((p) => (
                    <tr key={p.id} className="hover:bg-green-900/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-green-400">
                        {p.ioc}
                        <div className="text-[10px] text-green-600/50 mt-1 uppercase flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Blocked
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-900/30 text-green-500 border border-green-500/20 px-2 py-1 rounded text-xs uppercase">
                          {p.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/events/${p.campaignId}`} className="text-green-500 hover:text-green-300 transition-colors hover:underline truncate block max-w-[200px]" title={p.campaignName}>
                          {p.campaignName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-green-600/70 text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(p.timestamp), "MMM dd, HH:mm")}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
