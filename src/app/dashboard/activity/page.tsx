"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Bell, Loader2, Activity, User, ShieldAlert, CheckCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import PageHelp from "@/components/PageHelp";

type ActivityItem = {
  id: string;
  type: "contribution_approved" | "new_match" | "comment_added" | "alert" | "system";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
};

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeed() {
      try {
        if (!auth.currentUser) return;
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;

        // Query activities for the org or user
        const q1 = query(collection(db, "activity_feed"), where("organizationId", "==", orgId || ""));
        const q2 = query(collection(db, "activity_feed"), where("userId", "==", auth.currentUser.uid));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const itemsMap = new Map();
        
        snap1.docs.forEach(d => itemsMap.set(d.id, { id: d.id, ...d.data() }));
        snap2.docs.forEach(d => itemsMap.set(d.id, { id: d.id, ...d.data() }));

        const list = Array.from(itemsMap.values()) as ActivityItem[];
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setActivities(list);
      } catch (err) {
        console.error("Failed to fetch activity feed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "contribution_approved": return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "new_match": return <Activity className="w-5 h-5 text-indigo-400" />;
      case "alert": return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case "comment_added": return <MessageSquare className="w-5 h-5 text-blue-400" />;
      default: return <Bell className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-indigo-500" />
          Activity Feed
          <PageHelp title="Activity Feed" description="A live stream of everything happening in your organization. Monitor new campaigns being created, analyst contributions, and automated alerts for your Watchlist." />
        </h1>
        <p className="text-zinc-400 mt-2">
          Your running log of intelligence updates, watchlist hits, and team collaboration.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No recent activity.</p>
          <p className="text-sm mt-1">Updates to your tracked items and org events will appear here.</p>
        </div>
      ) : (
        <div className="relative pt-4">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />
          <div className="space-y-6">
            {activities.map((item) => (
              <div key={item.id} className="relative flex gap-5 group">
                <div className="absolute left-6 w-3 h-3 rounded-full bg-zinc-950 border-2 border-indigo-500 transform -translate-x-[5px] mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.5)] z-10" />
                <div className="pl-12 w-full">
                  <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                          {getIcon(item.type)}
                        </div>
                        <h3 className="text-base font-semibold text-zinc-100">{item.title}</h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-medium whitespace-nowrap bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                        {item.timestamp ? format(new Date(item.timestamp), "MMM dd, HH:mm") : "Unknown time"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed ml-12">
                      {item.description}
                    </p>
                    {item.link && (
                      <a href={item.link} className="ml-12 mt-3 inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                        View Details &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
