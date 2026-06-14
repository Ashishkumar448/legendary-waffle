"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc } from "firebase/firestore";
import { ShieldCheck, Plus, Link as LinkIcon, TriangleAlert, Activity, ArrowLeft, X, ShieldAlert, Download, Bot, Radar } from "lucide-react";
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
  const [pushing, setPushing] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // AI State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [attribution, setAttribution] = useState<any[] | null>(null);
  const [generatingAttribution, setGeneratingAttribution] = useState(false);

  const handleGenerateReport = async () => {
    if (!event || !event.events) return;
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: event.eventName,
          description: event.description,
          iocs: event.events
        })
      });
      const data = await res.json();
      if (data.report) setAiReport(data.report);
      else alert(data.error || "Failed to generate report");
    } catch (e) {
      console.error(e);
      alert("Error generating report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateAttribution = async () => {
    if (!event || !event.events) return;
    setGeneratingAttribution(true);
    try {
      const res = await fetch('/api/ai/attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: event.eventName,
          iocs: event.events
        })
      });
      const data = await res.json();
      if (data.attribution) setAttribution(data.attribution);
      else alert(data.error || "Failed to generate attribution");
    } catch (e) {
      console.error(e);
      alert("Error generating attribution");
    } finally {
      setGeneratingAttribution(false);
    }
  };

  const handleExport = (format: 'csv' | 'stix') => {
    if (!event || !event.events) return;
    
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'csv') {
      const headers = ['IOC', 'Type', 'Description', 'Timestamp', 'MITRE Tags'];
      const rows = event.events.map((ioc: any) => [
        `"${ioc.ioc || ioc.value}"`,
        `"${ioc.type}"`,
        `"${(ioc.description || '').replace(/"/g, '""')}"`,
        `"${ioc.timestamp}"`,
        `"${(ioc.mitreTags || []).join(', ')}"`
      ]);
      content = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
      filename = `${event.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    } else if (format === 'stix') {
      const stixObjects = event.events.map((ioc: any, idx: number) => ({
        type: 'indicator',
        spec_version: '2.1',
        id: `indicator--${crypto.randomUUID ? crypto.randomUUID() : 'id-'+idx}`,
        created: new Date(ioc.timestamp).toISOString(),
        modified: new Date().toISOString(),
        name: ioc.description || `Malicious ${ioc.type}`,
        description: `Exported from IOCAG. MITRE Tags: ${(ioc.mitreTags || []).join(', ')}`,
        pattern: ioc.type === 'ip' ? `[ipv4-addr:value = '${ioc.ioc || ioc.value}']` : 
                 ioc.type === 'domain' ? `[domain-name:value = '${ioc.ioc || ioc.value}']` :
                 `[file:hashes.'SHA-256' = '${ioc.ioc || ioc.value}']`,
        pattern_type: 'stix',
        valid_from: new Date(ioc.timestamp).toISOString()
      }));

      const bundle = {
        type: 'bundle',
        id: `bundle--${crypto.randomUUID ? crypto.randomUUID() : 'bndl-1'}`,
        objects: [
          {
            type: 'grouping',
            spec_version: '2.1',
            id: `grouping--${crypto.randomUUID ? crypto.randomUUID() : 'grp-1'}`,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            name: event.eventName,
            context: 'suspicious-activity',
            object_refs: stixObjects.map((o: any) => o.id)
          },
          ...stixObjects
        ]
      };
      
      content = JSON.stringify(bundle, null, 2);
      filename = `${event.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_stix2.json`;
      mimeType = 'application/json;charset=utf-8;';
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
  };

  const handlePushToDefense = async (ioc: any) => {
    setPushing(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await addDoc(collection(db, "defense_pushes"), {
        ioc: ioc.ioc || ioc.value,
        type: ioc.type,
        campaignId: id,
        campaignName: event.eventName,
        pushedBy: auth.currentUser?.uid,
        organizationId: event.organizationId,
        timestamp: new Date().toISOString(),
        status: "Blocked",
        destination: "SIEM Active Defense"
      });

      alert("✅ IOC successfully pushed to active defense perimeter!");
    } catch (err) {
      console.error(err);
      alert("❌ Error pushing IOC.");
    } finally {
      setPushing(false);
    }
  };

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
      // Fetch enrichment data to get MITRE tags
      let extractedMitreTags: string[] = [];
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const enrichRes = await fetch('/api/enrich', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ioc: newIoc, type: iocType })
          });
          const enrichData = await enrichRes.json();
          if (enrichData.results) {
            const otxResult = enrichData.results.find((r: any) => r.source === 'AlienVault OTX');
            if (otxResult && otxResult.mitreTags) {
              extractedMitreTags = otxResult.mitreTags;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to auto-tag MITRE", e);
      }

      const iocPayload = {
        ioc: newIoc,
        type: iocType,
        description: iocDescription || "Manually added IOC.",
        addedBy: auth.currentUser?.uid,
        timestamp: new Date().toISOString(),
        mitreTags: extractedMitreTags
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
        <div className="flex gap-2 relative">
          {!isOwner && event.isPublic && (
            <Link 
              href={`/dashboard/events/${id}/contribute`}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Propose Contribution
            </Link>
          )}
          <div className="relative">
            <button 
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all flex items-center border border-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button 
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  Export as CSV
                </button>
                <button 
                  onClick={() => handleExport('stix')}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-t border-zinc-800"
                >
                  Export as STIX 2.1 (JSON)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Intelligence Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Threat Narrative */}
        <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bot className="w-24 h-24 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-purple-400 mb-2 flex items-center gap-2 relative z-10">
            <Bot className="w-5 h-5" /> Executive Threat Narrative
          </h2>
          <p className="text-xs text-zinc-500 mb-4 relative z-10">Powered by LLaMA-3</p>
          
          {aiReport ? (
            <div className="text-sm text-zinc-300 leading-relaxed space-y-4 relative z-10 whitespace-pre-wrap">
              {aiReport}
            </div>
          ) : (
            <div className="relative z-10">
              <button 
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingReport ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Generating...</span>
                ) : "Generate Analyst Report"}
              </button>
              <p className="text-xs text-zinc-500 mt-3">Synthesizes campaign context and IOCs into a boardroom-ready summary.</p>
            </div>
          )}
        </div>

        {/* Threat Actor Fingerprinting */}
        <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(59,130,246,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Radar className="w-24 h-24 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-blue-400 mb-2 flex items-center gap-2 relative z-10">
            <Radar className="w-5 h-5" /> Attribution Fingerprinting
          </h2>
          <p className="text-xs text-zinc-500 mb-4 relative z-10">Heuristic TTP Clustering</p>
          
          {attribution ? (
            <div className="space-y-4 relative z-10">
              {attribution.map((attr, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">{attr.actor}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${attr.confidence > 60 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {attr.confidence}% Match
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-3">
                    <div className={`${attr.confidence > 60 ? 'bg-red-500' : 'bg-yellow-500'} h-1.5 rounded-full`} style={{ width: `${attr.confidence}%` }}></div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{attr.evidence}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative z-10">
              <button 
                onClick={handleGenerateAttribution}
                disabled={generatingAttribution}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingAttribution ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Correlating TTPs...</span>
                ) : "Run Attribution Engine"}
              </button>
              <p className="text-xs text-zinc-500 mt-3">Clusters MITRE tags and infrastructure patterns against known APT profiles.</p>
            </div>
          )}
        </div>
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
                        <div className="text-xs text-zinc-500 uppercase flex flex-wrap items-center gap-2 mt-1">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-300 font-bold tracking-wider">{ioc.type}</span>
                          {ioc.description && <span className="truncate max-w-xs">{ioc.description}</span>}
                          {ioc.mitreTags && ioc.mitreTags.map((tag: string) => (
                             <a 
                               key={tag} 
                               href={`https://attack.mitre.org/techniques/${tag.replace('.', '/')}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               onClick={(e) => e.stopPropagation()}
                               className="bg-purple-900/40 hover:bg-purple-900/60 transition-colors text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider cursor-pointer"
                             >
                               {tag}
                             </a>
                          ))}
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
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handlePushToDefense(selectedIoc)}
                  disabled={pushing}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4" />
                  {pushing ? "Dispatching to SIEM..." : "Push to Active Defense"}
                </button>
                
                {(selectedIoc.type === 'url' || selectedIoc.type === 'mitre_technique') && (
                  <a 
                    href={selectedIoc.type === 'mitre_technique' ? `https://attack.mitre.org/techniques/${(selectedIoc.mitreId || '').replace('.', '/')}` : (selectedIoc.ioc || selectedIoc.value)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" /> Open External Link
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
