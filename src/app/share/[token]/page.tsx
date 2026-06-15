"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, Database } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function PublicSharePage() {
  const { token } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSharedEvent() {
      if (!token) return;
      try {
        const eventDoc = await getDoc(doc(db, "threatEvents", token as string));
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          if (data.isPublic) {
            setEvent({ id: eventDoc.id, ...data });
          } else {
            setError("This campaign is no longer public or the link has expired.");
          }
        } else {
          setError("Threat campaign not found. It may have been deleted.");
        }
      } catch (err) {
        console.error(err);
        setError("You do not have permission to view this campaign or the link is invalid.");
      } finally {
        setLoading(false);
      }
    }
    fetchSharedEvent();
  }, [token]);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex justify-center items-center text-zinc-500">Loading Intelligence...</div>;
  
  if (error) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-4">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
      <p className="text-zinc-400 mb-8 max-w-md">{error}</p>
      <Link href="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">Return to Login</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-10 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 flex items-center justify-center rounded-xl border border-indigo-500/30">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Public Threat Intelligence</div>
              <div className="text-xl font-bold text-white tracking-tight">IOCAG Platform</div>
            </div>
          </div>
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Analyst Login
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Database className="w-64 h-64 text-zinc-500" />
          </div>

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded border border-red-500/30 mb-4">
              {event.status || 'Active Campaign'}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">{event.eventName}</h1>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-2xl">
              {event.description || "No description provided. This is an active threat campaign containing actionable indicators of compromise."}
            </p>

            <div className="flex flex-wrap gap-6 mb-12 border-y border-zinc-800 py-4 bg-zinc-950/30 px-6 rounded-2xl">
              <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                <Clock className="w-5 h-5 text-zinc-500" />
                Disclosed: {event.createdAt ? format(new Date(event.createdAt), "PPP") : "Unknown"}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                TLP:CLEAR (Publicly Sharable)
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6">Technical Indicators ({event.events?.length || 0})</h2>
            
            {(!event.events || event.events.length === 0) ? (
              <div className="p-8 text-center text-zinc-500 bg-zinc-950/50 rounded-xl border border-zinc-800">
                No indicators attached to this public campaign.
              </div>
            ) : (
              <div className="space-y-4">
                {event.events.map((ioc: any, idx: number) => (
                  <div key={idx} className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-500/50 transition-colors group">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                          {ioc.type}
                        </span>
                        <span className="font-mono text-zinc-100 font-medium break-all selection:bg-indigo-500/50">{ioc.ioc || ioc.value}</span>
                      </div>
                      {ioc.description && <div className="text-sm text-zinc-500">{ioc.description}</div>}
                      {ioc.mitreTags && ioc.mitreTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {ioc.mitreTags.map((t: string) => (
                            <span key={t} className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
