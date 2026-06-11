"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { ShieldCheck, Plus, Link as LinkIcon, TriangleAlert, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newIoc, setNewIoc] = useState("");
  const [iocType, setIocType] = useState("domain");
  const [adding, setAdding] = useState(false);
  const [correlatedEvents, setCorrelatedEvents] = useState<any[]>([]);
  const router = useRouter();
  
  // To check if the current user belongs to the org that owns this event
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (!id || !auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;

        const eventDoc = await getDoc(doc(db, "threatEvents", id as string));
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setEvent({ id: eventDoc.id, ...data });
          setIsOwner(data.organizationId === orgId);

          // Fetch correlated events
          if (data.iocStrings && data.iocStrings.length > 0) {
            fetch(`/api/correlate/${id}`)
              .then(res => res.json())
              .then(resData => {
                if (resData.success) {
                  setCorrelatedEvents(resData.correlatedEvents);
                }
              })
              .catch(console.error);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const handleAddIoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIoc || !isOwner) return;
    setAdding(true);
    try {
      const iocPayload = {
        ioc: newIoc,
        type: iocType,
        addedBy: auth.currentUser?.uid,
        timestamp: new Date().toISOString()
      };
      
      const eventRef = doc(db, "threatEvents", id as string);
      await updateDoc(eventRef, {
        events: arrayUnion(iocPayload),
        iocStrings: arrayUnion(newIoc)
      });
      
      setEvent((prev: any) => ({
        ...prev,
        events: [...(prev.events || []), iocPayload]
      }));
      setNewIoc("");
    } catch (err) {
      console.error(err);
      alert("Failed to add IOC");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="text-zinc-500">Loading event details...</div>;
  if (!event) return <div className="text-red-500">Event not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link 
        href="/dashboard/events" 
        className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{event.eventName}</h1>
          <p className="text-zinc-400 mt-1 mb-4">Status: <span className="text-blue-400">{event.status}</span> • Type: {event.type}</p>
          {event.description && (
            <div className="text-zinc-300 text-sm leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-w-3xl">
              {event.description}
            </div>
          )}
        </div>
        {!isOwner && event.isPublic && (
          <Link 
            href={`/dashboard/events/${id}/contribute`}
            className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Propose Contribution
          </Link>
        )}
      </div>

      {isOwner && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-4">Add IOC to Campaign</h2>
          <form onSubmit={handleAddIoc} className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              value={newIoc}
              onChange={e => setNewIoc(e.target.value)}
              placeholder="Enter indicator (e.g. evil.com)"
              required
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <select
              value={iocType}
              onChange={e => setIocType(e.target.value)}
              className="md:w-40 bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none appearance-none"
            >
              <option value="domain">Domain</option>
              <option value="ip">IP</option>
              <option value="hash">Hash</option>
            </select>
            <button 
              type="submit" 
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add IOC"}
            </button>
          </form>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Campaign IOCs ({event.events?.length || 0})</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {(!event.events || event.events.length === 0) ? (
            <div className="p-8 text-center text-zinc-500">No IOCs attached to this event yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {event.events.map((ioc: any, idx: number) => {
                const isCorrelated = correlatedEvents.some(ce => ce.iocStrings?.includes(ioc.ioc || ioc.value));
                return (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          {ioc.type === 'url' ? (
                            <a href={ioc.ioc || ioc.value} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline transition-colors">
                              {ioc.ioc || ioc.value}
                            </a>
                          ) : ioc.type === 'mitre_technique' ? (
                            <a href={`https://attack.mitre.org/techniques/${(ioc.mitreId || '').replace('.', '/')}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline transition-colors">
                              {ioc.ioc || ioc.value}
                            </a>
                          ) : (
                            <span>{ioc.ioc || ioc.value}</span>
                          )}
                          {isCorrelated && (
                            <span title="This IOC appears in other campaigns!" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                              <TriangleAlert className="w-3 h-3" /> Correlated
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 uppercase">{ioc.type}</div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(ioc.timestamp).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {correlatedEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-400" /> Correlated Campaigns ({correlatedEvents.length})
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {correlatedEvents.map(ce => (
              <Link key={ce.id} href={`/dashboard/events/${ce.id}`}>
                <div className="bg-zinc-900/50 border border-red-500/20 rounded-xl p-4 hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-between group">
                  <div>
                    <div className="text-white font-medium group-hover:text-red-400 transition-colors flex items-center gap-2">
                      {ce.eventName}
                      <span className="text-[10px] uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{ce.type}</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {ce.organizationId === "MITRE_CORP" ? "Official MITRE Data" : 
                       ce.organizationId === "ALIENVAULT_OTX" ? "AlienVault OTX Pulse" : 
                       "Cross-Organizational Event"}
                    </div>
                  </div>
                  <LinkIcon className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
