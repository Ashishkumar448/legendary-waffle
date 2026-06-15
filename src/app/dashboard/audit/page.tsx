"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { List, Loader2, User, Clock, ShieldAlert } from "lucide-react";
import PageHelp from "@/components/PageHelp";
import { format } from "date-fns";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;
        
        if (orgId) {
          // Fallback to fetching recent Activity Feed since audit_logs requires a backend trigger to populate realistically
          const aQuery = query(
            collection(db, "activity_feed"), 
            where("organizationId", "==", orgId),
            limit(100)
          );
          const snap = await getDocs(aQuery);
          
          let list: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // In JS sort because index might be missing
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(list);
        }
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <List className="w-8 h-8 text-indigo-500" />
          Immutable Audit Log
          <PageHelp 
            title="Audit Log" 
            description="A read-only, immutable record of all actions taken within your organization's workspace. Used for compliance, debugging, and identifying who added specific IOCs or modified Threat Events." 
          />
        </h1>
        <p className="text-zinc-400 mt-2">
          Organization-wide compliance tracking of platform actions.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400" /> System Actions Ledger
          </h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No audit logs recorded yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Timestamp</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Action Type</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4 whitespace-nowrap text-zinc-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {log.timestamp ? format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss") : "Unknown"}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      log.type === 'alert' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      log.type === 'contribution' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {log.type || "SYS_ACTION"}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-300 w-full">
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
