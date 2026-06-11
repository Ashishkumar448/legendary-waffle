"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Globe, Shield, PlusCircle, Search, Building, ListFilter, RefreshCw } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let unsubscribeGlobal: () => void;
    let unsubscribeOrg: () => void;

    async function setupListeners() {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const orgId = userDoc.data()?.organizationId;

      const handleSnapshots = (globalSnap?: any, orgSnap?: any) => {
        const dataMap = new Map();
        
        if (globalSnap) {
          globalSnap.docs.forEach((d: any) => dataMap.set(d.id, { id: d.id, ...d.data() }));
        }
        if (orgSnap) {
          orgSnap.docs.forEach((d: any) => dataMap.set(d.id, { id: d.id, ...d.data() }));
        }

        let data = Array.from(dataMap.values());
        data.sort((a: any, b: any) => {
          const t1 = a.createdAt?.toMillis() || 0;
          const t2 = b.createdAt?.toMillis() || 0;
          return t2 - t1;
        });
        setEvents(data);
        setLoading(false);
      };

      let currentGlobalSnap: any = null;
      let currentOrgSnap: any = null;

      if (filter === "global" || filter === "all") {
        const qGlobal = query(collection(db, "threatEvents"), where("isPublic", "==", true));
        unsubscribeGlobal = onSnapshot(qGlobal, (snap) => {
          currentGlobalSnap = snap;
          handleSnapshots(currentGlobalSnap, currentOrgSnap);
        }, (error) => {
          console.error("Firebase listener error (Global):", error);
        });
      }

      if ((filter === "org" || filter === "all") && orgId) {
        const qOrg = query(collection(db, "threatEvents"), where("organizationId", "==", orgId));
        unsubscribeOrg = onSnapshot(qOrg, (snap) => {
          currentOrgSnap = snap;
          handleSnapshots(currentGlobalSnap, currentOrgSnap);
        }, (error) => {
          console.error("Firebase listener error (Org):", error);
        });
      }
    }

    setupListeners();

    return () => {
      if (unsubscribeGlobal) unsubscribeGlobal();
      if (unsubscribeOrg) unsubscribeOrg();
    };
  }, [filter]);

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      await fetch('/api/sync-mitre', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.eventName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {filter === "org" ? <Building className="w-6 h-6 text-blue-400" /> : 
             filter === "global" ? <Globe className="w-6 h-6 text-blue-400" /> : 
             <ListFilter className="w-6 h-6 text-blue-400" />}
            {filter === "org" ? "My Organization Events" : filter === "global" ? "Global Threat Events" : "All Threat Events"}
          </h1>
          <p className="text-zinc-400 mt-1">
            {filter === "org" ? "Internal campaigns and investigations tracked by your team." : 
             "Real-time feed of publicly shared organizational campaigns and MITRE events."}
          </p>
        </div>
        <div className="flex gap-2">
          {filter !== "org" && (
            <button 
              onClick={handleSyncData}
              disabled={syncing}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> 
              {syncing ? 'Syncing...' : 'Sync Global Data'}
            </button>
          )}
          <Link 
            href="/dashboard/events/add"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all flex items-center"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> New Event
          </Link>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Filter events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
        />
      </div>

      {loading ? (
        <div className="text-zinc-500 text-center py-10">Listening for global events...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map(event => (
            <Link key={event.id} href={`/dashboard/events/${event.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-blue-500/50 transition-colors cursor-pointer flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {event.eventName}
                    <span className="text-[10px] uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{event.type}</span>
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span>{event.events?.length || 0} IOCs attached</span>
                    <span>•</span>
                    {event.organizationId === 'MITRE_CORP' ? (
                      <span className="flex items-center gap-1 text-green-400"><Shield className="w-3 h-3" /> MITRE Analyzed</span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-400"><Building className="w-3 h-3" /> Org Reported</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${
                    event.status === 'Active' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    event.status === 'Resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {event.status}
                  </div>
                  <div className="text-xs text-zinc-600 mt-2">
                    Updated {new Date(event.updatedAt?.toDate() || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              No public events found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
