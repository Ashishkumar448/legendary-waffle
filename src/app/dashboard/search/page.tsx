"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import Fuse from "fuse.js";
import { Search, Loader2, Shield, AlertTriangle, FileCode, Globe, Link as LinkIcon, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";

type SearchableItem = {
  id: string;
  type: "campaign" | "ioc";
  title: string;
  description: string;
  campaignId?: string;
  campaignName?: string;
  iocType?: string;
  timestamp?: string;
};

export default function SearchPage() {
  const [items, setItems] = useState<SearchableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!auth.currentUser) return;
        
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;

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
        const extractedItems: SearchableItem[] = [];

        allDocs.forEach((docSnap) => {
          const data = docSnap.data();
          const eventId = docSnap.id;
          
          extractedItems.push({
            id: `campaign_${eventId}`,
            type: "campaign",
            title: data.eventName || "Unnamed Campaign",
            description: data.description || "",
            campaignId: eventId,
            timestamp: data.createdAt
          });

          if (data.events && Array.isArray(data.events)) {
            data.events.forEach((ioc: any, index: number) => {
              const iocValue = ioc.ioc || ioc.value;
              if (iocValue) {
                extractedItems.push({
                  id: `ioc_${eventId}_${index}_${iocValue}`,
                  type: "ioc",
                  title: iocValue,
                  description: ioc.description || "",
                  campaignId: eventId,
                  campaignName: data.eventName,
                  iocType: ioc.type || "unknown",
                  timestamp: ioc.timestamp
                });
              }
            });
          }
        });

        // Sort initially by latest if timestamp exists
        extractedItems.sort((a, b) => {
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tB - tA;
        });

        setItems(extractedItems);
      } catch (err) {
        console.error("Failed to fetch search data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    
    // Auto focus search input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: [
        { name: "title", weight: 2 },
        { name: "description", weight: 1 },
        { name: "campaignName", weight: 1 },
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
    });
  }, [items]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return items.slice(0, 30); // Show recent 30 if no query
    }
    return fuse.search(searchQuery).map(res => res.item).slice(0, 50);
  }, [searchQuery, fuse, items]);

  // Icon helper
  const getIcon = (type: string, iocType?: string) => {
    if (type === "campaign") return <Shield className="w-5 h-5 text-red-400" />;
    switch (iocType?.toLowerCase()) {
      case "ip": return <Globe className="w-5 h-5 text-blue-400" />;
      case "hash": return <FileCode className="w-5 h-5 text-red-400" />;
      case "domain":
      case "url": return <LinkIcon className="w-5 h-5 text-amber-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-zinc-400" />;
    }
  };

  const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return format(d, "MMM dd, yyyy");
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Search Header */}
      <div className="text-center space-y-4 pt-10 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
          Lightning <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Global Search</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Fuzzy search across millions of indicators, descriptions, and threat campaigns instantly. Typo-tolerant and lightning fast.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-3xl mx-auto group z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
        <div className="relative bg-zinc-900 border border-zinc-700 hover:border-indigo-500/50 rounded-2xl p-2 flex items-center shadow-2xl transition-colors duration-300">
          <Search className="w-6 h-6 text-zinc-400 ml-3 flex-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for an IP, hash, APT name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-zinc-100 placeholder-zinc-500 px-4 py-3 text-lg focus:outline-none focus:ring-0"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-zinc-500 hover:text-zinc-300 px-4 text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="text-center mt-4 text-xs text-zinc-500 font-mono tracking-widest uppercase">
          {loading ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Indexing database...</span>
          ) : (
            `Indexed ${items.length} searchable entities`
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
          <AlertTriangle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-lg font-medium text-zinc-400">No matching threats found.</p>
          <p className="text-sm mt-1 text-zinc-600">Try adjusting your search query or check for typos.</p>
        </div>
      ) : (
        <div className="grid gap-4 mt-8">
          {searchResults.map((item) => (
            <Link key={item.id} href={`/dashboard/events/${item.campaignId}`}>
              <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-900/90 rounded-2xl p-5 transition-all duration-300 group flex flex-col sm:flex-row sm:items-center gap-5 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:-translate-y-0.5">
                
                {/* Icon Circle */}
                <div className={`flex-none w-14 h-14 rounded-full flex items-center justify-center transition-colors ${item.type === 'campaign' ? 'bg-red-500/10 border border-red-500/20 group-hover:border-red-500/40' : 'bg-zinc-950 border border-zinc-800 group-hover:border-indigo-500/30'}`}>
                  {getIcon(item.type, item.iocType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ${item.type === 'campaign' ? 'text-red-400 bg-red-400/10' : 'text-zinc-400 bg-zinc-800'}`}>
                      {item.type === 'campaign' ? 'Campaign' : item.iocType}
                    </span>
                    {safeFormatDate(item.timestamp) && (
                      <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                        <Calendar className="w-3 h-3" />
                        {safeFormatDate(item.timestamp)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors truncate">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Context / Actions */}
                <div className="flex-none sm:text-right mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-zinc-800 sm:border-0">
                  {item.type === 'ioc' && item.campaignName && (
                    <div className="text-xs text-zinc-500 mb-2 font-medium bg-zinc-950/50 px-3 py-1.5 rounded-lg inline-block border border-zinc-800/50">
                      Campaign: <span className="text-zinc-300 ml-1">{item.campaignName}</span>
                    </div>
                  )}
                  <div className="flex items-center sm:justify-end gap-1.5 text-sm font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 mt-1">
                    Investigate <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
