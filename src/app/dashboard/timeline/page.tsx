"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, Globe, FileCode, Link as LinkIcon, Shield, Clock, ChevronDown, Activity, AlertTriangle, BarChart3 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type TimelineEvent = {
  ioc: string;
  type: string;
  description?: string;
  timestamp: string;
  campaignId: string;
  campaignName: string;
};

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string, name: string }[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    async function fetchTimelineData() {
      try {
        if (!auth.currentUser) return;
        
        // Fetch User Org
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;

        // Fetch Global and Org Events
        const qGlobal = query(collection(db, "threatEvents"), where("isPublic", "==", true));
        const globalSnap = await getDocs(qGlobal);
        
        let orgDocs: any[] = [];
        if (orgId) {
          const qOrg = query(collection(db, "threatEvents"), where("organizationId", "==", orgId));
          const orgSnap = await getDocs(qOrg);
          orgDocs = orgSnap.docs;
        }

        const dataMap = new Map();
        globalSnap.docs.forEach((d) => dataMap.set(d.id, d));
        orgDocs.forEach((d) => dataMap.set(d.id, d));

        const allDocs = Array.from(dataMap.values());
        
        const extractedEvents: TimelineEvent[] = [];
        const extractedCampaigns = new Map<string, string>();

        allDocs.forEach(docSnap => {
          const data = docSnap.data();
          const eventId = docSnap.id;
          const eventName = data.eventName || "Unnamed Campaign";
          
          extractedCampaigns.set(eventId, eventName);

          if (data.events && Array.isArray(data.events)) {
            data.events.forEach((iocObj: any) => {
              if (iocObj.ioc && iocObj.timestamp) {
                extractedEvents.push({
                  ioc: iocObj.ioc,
                  type: iocObj.type?.toLowerCase() || "unknown",
                  description: iocObj.description || "No context provided.",
                  timestamp: iocObj.timestamp,
                  campaignId: eventId,
                  campaignName: eventName
                });
              }
            });
          }
        });

        // Sort descending (newest first) for the list view
        extractedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Create time buckets for the Histogram (ascending order for X-axis)
        const bucketMap = new Map<string, any>();
        // Iterate backwards (oldest to newest) to naturally sort the X-axis
        const reversedEvents = [...extractedEvents].reverse();
        
        reversedEvents.forEach(e => {
          let parsedDate;
          try {
            parsedDate = parseISO(e.timestamp);
          } catch { return; }
          
          // Bucket by hour/minute
          const bucketKey = format(parsedDate, "MMM dd, HH:mm");
          
          if (!bucketMap.has(bucketKey)) {
            bucketMap.set(bucketKey, {
              time: bucketKey,
              ip: 0,
              domain: 0,
              hash: 0,
              mitre: 0,
              other: 0,
              campaignId: e.campaignId
            });
          }
          
          const bucket = bucketMap.get(bucketKey);
          
          if (e.type === "ip") bucket.ip += 1;
          else if (e.type === "domain" || e.type === "url") bucket.domain += 1;
          else if (e.type === "hash") bucket.hash += 1;
          else if (e.type === "mitre_technique") bucket.mitre += 1;
          else bucket.other += 1;
        });

        setHistogramData(Array.from(bucketMap.values()));
        setEvents(extractedEvents);
        
        const campaignList = Array.from(extractedCampaigns.entries()).map(([id, name]) => ({ id, name }));
        setCampaigns(campaignList);
      } catch (err) {
        console.error("Failed to fetch timeline data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTimelineData();
  }, []);

  const filteredEvents = useMemo(() => {
    if (selectedCampaign === "ALL") return events;
    return events.filter(e => e.campaignId === selectedCampaign);
  }, [events, selectedCampaign]);

  const filteredHistogramData = useMemo(() => {
    if (selectedCampaign === "ALL") return histogramData;
    return histogramData.filter(h => h.campaignId === selectedCampaign);
  }, [histogramData, selectedCampaign]);

  const displayedEvents = useMemo(() => {
    let list = filteredEvents;
    if (selectedBucket) {
      list = list.filter(e => {
        try {
          return format(parseISO(e.timestamp), "MMM dd, HH:mm") === selectedBucket;
        } catch { return false; }
      });
    }
    return list;
  }, [filteredEvents, selectedBucket]);

  const getIcon = (type: string) => {
    switch (type) {
      case "ip": return <Globe className="w-5 h-5 text-blue-400" />;
      case "hash": return <FileCode className="w-5 h-5 text-red-400" />;
      case "domain":
      case "url": return <LinkIcon className="w-5 h-5 text-amber-400" />;
      case "mitre_technique": return <Shield className="w-5 h-5 text-purple-400" />;
      default: return <Activity className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case "ip": return "border-blue-500/30 bg-blue-500/5";
      case "hash": return "border-red-500/30 bg-red-500/5";
      case "domain":
      case "url": return "border-amber-500/30 bg-amber-500/5";
      case "mitre_technique": return "border-purple-500/30 bg-purple-500/5";
      default: return "border-zinc-700 bg-zinc-800/50";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-500" />
            Attack Timeline Reconstruction
          </h1>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            A chronological replay of the attack chain. Trace exactly when indicators were discovered across the network.
          </p>
        </div>

        <div className="relative min-w-[250px]">
          <select 
            value={selectedCampaign}
            onChange={(e) => {
              setSelectedCampaign(e.target.value);
              setSelectedBucket(null); // Reset time filter when campaign changes
            }}
            className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-zinc-100 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
          >
            <option value="ALL">Global Timeline (All Campaigns)</option>
            <optgroup label="Your Campaigns">
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-zinc-400 animate-pulse">Reconstructing attack sequences...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-zinc-600 mb-4" />
          <h3 className="text-xl font-semibold text-zinc-200">No Events Found</h3>
          <p className="text-zinc-500 mt-2 max-w-md">No timeline data available for the selected scope. Try adjusting the filter or seeding more data.</p>
        </div>
      ) : (
        <>
          {/* Histogram Chart */}
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 shadow-xl mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-semibold text-zinc-100">Activity Volume Over Time</h3>
                <span className="text-xs text-zinc-500 ml-2">(Click a bar to filter timeline below)</span>
              </div>
              {selectedBucket && (
                <button 
                  onClick={() => setSelectedBucket(null)}
                  className="text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/20 font-medium"
                >
                  Clear Time Filter: {selectedBucket}
                </button>
              )}
            </div>
            <div className="h-[300px] w-full min-h-[300px]">
              {isMounted && (
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart 
                    data={filteredHistogramData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    onClick={(state: any) => {
                      if (state && state.activeLabel) {
                        const labelStr = String(state.activeLabel);
                        setSelectedBucket(labelStr === selectedBucket ? null : labelStr);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#71717a" 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickMargin={15}
                    />
                    <YAxis 
                      stroke="#71717a" 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickMargin={10}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#e4e4e7' }}
                      itemStyle={{ fontSize: '13px' }}
                      labelStyle={{ color: '#a1a1aa', marginBottom: '8px', fontWeight: 'bold' }}
                      cursor={{ fill: '#27272a', opacity: 0.4 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="ip" stackId="a" fill="#3b82f6" name="IP Addresses" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="domain" stackId="a" fill="#fbbf24" name="Domains" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="hash" stackId="a" fill="#ef4444" name="Hashes" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="mitre" stackId="a" fill="#a855f7" name="MITRE Tactics" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="other" stackId="a" fill="#71717a" name="Other" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="relative w-full pt-4">
            
            {/* Vertical Center Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-800 transform md:-translate-x-1/2"></div>

          <div className="space-y-12">
            {displayedEvents.length === 0 ? (
               <div className="text-center py-10 text-zinc-500">No events found for this specific time bucket.</div>
            ) : displayedEvents.map((event, index) => {
              // Determine if it should be on left or right side in desktop view
              const isLeft = index % 2 === 0;
              let parsedDate = null;
              try {
                parsedDate = parseISO(event.timestamp);
              } catch (e) {
                // Ignore parse errors if data is bad
              }

              return (
                <div key={index} className={`relative flex flex-col md:flex-row items-center w-full ${isLeft ? 'md:justify-start' : 'md:justify-end'}`}>
                  
                  {/* Center Dot */}
                  <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-zinc-950 border-2 border-indigo-500 rounded-full transform -translate-x-1/2 z-10 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>

                  {/* Card Container */}
                  <div className={`w-full md:w-5/12 pl-12 md:pl-0 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
                    <Link href={`/dashboard/events/${event.campaignId}`}>
                      <div className={`p-5 rounded-2xl backdrop-blur-md border ${getColorClass(event.type)} transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:-translate-y-1 hover:border-indigo-500/50 duration-300 relative group cursor-pointer`}>
                        
                        {/* Connection Line to Center */}
                        <div className={`hidden md:block absolute top-1/2 w-12 h-0.5 bg-zinc-800 group-hover:bg-indigo-500/50 transition-colors -z-10 ${isLeft ? '-right-12' : '-left-12'}`}></div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-950/50 rounded-lg backdrop-blur-sm border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                              {getIcon(event.type)}
                            </div>
                            <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase group-hover:text-zinc-300 transition-colors">{event.type.replace('_', ' ')}</span>
                          </div>
                          <span className="text-xs font-medium text-zinc-400 bg-zinc-950/40 px-2.5 py-1 rounded-full border border-white/5 shadow-inner">
                            {parsedDate ? format(parsedDate, "MMM dd, yyyy • HH:mm:ss") : "Unknown Time"}
                          </span>
                        </div>

                        <h3 className="text-lg font-mono font-bold text-zinc-100 mb-2 truncate group-hover:text-white transition-colors" title={event.ioc}>
                          {event.ioc}
                        </h3>
                        
                        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between group-hover:border-indigo-500/20 transition-colors">
                          <span className="text-xs font-medium text-indigo-400 truncate max-w-[200px]" title={event.campaignName}>
                            View Campaign: {event.campaignName}
                          </span>
                          <span className="text-xs text-zinc-500 group-hover:text-indigo-400 transition-colors">&rarr;</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
