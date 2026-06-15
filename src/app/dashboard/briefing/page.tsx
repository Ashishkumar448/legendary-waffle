"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Newspaper, Loader2, Target, Users, ShieldAlert, Activity } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import PageHelp from "@/components/PageHelp";

export default function DailyBriefingPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    watchlistHits: 0,
    pendingContributions: 0,
    recentActivities: 0
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBriefing() {
      try {
        if (!auth.currentUser) return;
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;

        // Fetch active org campaigns
        let campaigns = 0;
        let eventsList: any[] = [];
        if (orgId) {
          const cQuery = query(collection(db, "threatEvents"), where("organizationId", "==", orgId));
          const cSnap = await getDocs(cQuery);
          campaigns = cSnap.size;
          
          eventsList = cSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 5);
          eventsList.sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
        }

        // Fetch pending contributions
        let pending = 0;
        if (orgId) {
          const pQuery = query(collection(db, "contributions"), where("targetOrganizationId", "==", orgId), where("status", "==", "pending"));
          const pSnap = await getDocs(pQuery);
          pending = pSnap.size;
        }

        // Fetch recent activities
        let activities = 0;
        if (orgId) {
          const aQuery = query(collection(db, "activity_feed"), where("organizationId", "==", orgId), limit(50));
          const aSnap = await getDocs(aQuery);
          activities = aSnap.size;
        }

        setStats({
          activeCampaigns: campaigns,
          watchlistHits: 0, // Placeholder, would need complex aggregation
          pendingContributions: pending,
          recentActivities: activities
        });
        setRecentEvents(eventsList);
      } catch (err) {
        console.error("Failed to fetch briefing data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBriefing();
  }, []);

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "Unknown";
    try {
      if (typeof dateVal.toDate === 'function') {
        return format(dateVal.toDate(), "PP");
      }
      return format(new Date(dateVal), "PP");
    } catch (e) {
      return "Invalid Date";
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-zinc-500" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-indigo-500" />
            Daily Intelligence Briefing
            <PageHelp title="Daily Briefing" description="Your customized daily summary of the threat landscape. It highlights active campaigns in your organization, recent Watchlist hits, and pending Inbox contributions." />
          </h1>
          <p className="text-zinc-400 mt-2">
            Good morning. Here is your summary of the threat landscape for {format(new Date(), "MMMM do, yyyy")}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Active Campaigns</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-100">{stats.activeCampaigns}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Watchlist Hits (24h)</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-100">{stats.watchlistHits}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Pending Inbox</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-100">{stats.pendingContributions}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Team Actions (24h)</h3>
          </div>
          <p className="text-4xl font-bold text-zinc-100">{stats.recentActivities}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            Latest Threat Events
          </h2>
          {recentEvents.length === 0 ? (
            <p className="text-zinc-500 text-sm">No recent events tracked.</p>
          ) : (
            <div className="space-y-4">
              {recentEvents.map(event => (
                <div key={event.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                  <h3 className="font-semibold text-zinc-200">{event.eventName}</h3>
                  <p className="text-xs text-zinc-500 mt-1">Logged: {formatDate(event.createdAt)}</p>
                  <Link href={`/dashboard/events/${event.id}`} className="text-xs text-indigo-400 mt-2 inline-block hover:underline">
                    View Details &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Action Items
          </h2>
          <div className="space-y-4">
             <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
               <h3 className="font-semibold text-amber-400 text-sm">Review Pending Contributions</h3>
               <p className="text-xs text-zinc-400 mt-1">You have {stats.pendingContributions} IOCs waiting for approval.</p>
               <Link href="/dashboard/contributions" className="text-xs font-semibold text-amber-300 mt-2 inline-block hover:underline">
                 Go to Inbox &rarr;
               </Link>
             </div>
             
             <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
               <h3 className="font-semibold text-blue-400 text-sm">Review Activity Feed</h3>
               <p className="text-xs text-zinc-400 mt-1">Catch up on what your team has been doing.</p>
               <Link href="/dashboard/activity" className="text-xs font-semibold text-blue-300 mt-2 inline-block hover:underline">
                 View Feed &rarr;
               </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
