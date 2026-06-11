"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { ShieldCheck, Plus, Link as LinkIcon, TriangleAlert, Activity, ArrowLeft, X } from "lucide-react";
import Link from "next/link";

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Add IOC Form State
  const [newIoc, setNewIoc] = useState("");
  const [iocType, setIocType] = useState("domain");
  const [iocDescription, setIocDescription] = useState("");
  const [adding, setAdding] = useState(false);
  
  const [correlatedEvents, setCorrelatedEvents] = useState<any[]>([]);
  const router = useRouter();
  
  // Modal State
  const [selectedIoc, setSelectedIoc] = useState<any>(null);

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
        description: iocDescription || "Manually added IOC.",
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
      setIocDescription("");
    } catch (err) {
      console.error(err);
      alert("Failed to add IOC");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="text-zinc-500 flex justify-center py-20">Loading event details...</div>;
  if (!event) return <div className="text-red-500 flex justify-center py-20">Event not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
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
            <div className="text-zinc-300 text-sm leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-w-3xl whitespace-pre-wrap">
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
          <form onSubmit={handleAddIoc} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
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
                <option value="url">URL</option>
              </select>
            </div>
            <textarea
              value={iocDescription}
              onChange={e => setIocDescription(e.target.value)}
              placeholder="Description or context for this indicator..."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={adding}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition-all disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add IOC"}
              </button>
            </div>
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
                  <button 
                    key={idx} 
                    onClick={() => setSelectedIoc({ ...ioc, isCorrelated })}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors focus:outline-none focus:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          <span className="truncate max-w-sm md:max-w-md">{ioc.ioc || ioc.value}</span>
                          {isCorrelated && (
                            <span title="This IOC appears in other campaigns!" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                              <TriangleAlert className="w-3 h-3" /> Correlated
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 uppercase flex items-center gap-2 mt-1">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300 font-bold tracking-wider">{ioc.type}</span>
                          {ioc.description && <span className="truncate max-w-xs">{ioc.description}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 hidden sm:block">
                      {new Date(ioc.timestamp).toLocaleString()}
                    </div>
                  </button>
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

      {/* IOC Details Modal */}
      {selectedIoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                IOC Details
              </h3>
              <button 
                onClick={() => setSelectedIoc(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Indicator Value</div>
                <div className="text-white font-mono bg-zinc-950 border border-zinc-800 p-3 rounded-lg break-all select-all">
                  {selectedIoc.ioc || selectedIoc.value}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Type</div>
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider inline-block">
                    {selectedIoc.type}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Date Added</div>
                  <div className="text-sm text-zinc-300">
                    {new Date(selectedIoc.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Context / Description</div>
                <div className="text-sm text-zinc-300 bg-zinc-800/30 rounded-lg p-3 whitespace-pre-wrap">
                  {selectedIoc.description || "No description provided."}
                </div>
              </div>

              {selectedIoc.isCorrelated && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
                  <TriangleAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <div className="text-red-400 font-medium text-sm">Highly Correlated Indicator</div>
                    <div className="text-zinc-400 text-xs mt-1 leading-relaxed">
                      This indicator has been observed across multiple active campaigns. It is highly recommended to prioritize blocking this IOC at your firewall or endpoint.
                    </div>
                  </div>
                </div>
              )}
              
              {(selectedIoc.type === 'url' || selectedIoc.type === 'mitre_technique') && (
                <div>
                  <a 
                    href={selectedIoc.type === 'mitre_technique' ? `https://attack.mitre.org/techniques/${(selectedIoc.mitreId || '').replace('.', '/')}` : (selectedIoc.ioc || selectedIoc.value)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" /> Open External Link
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
