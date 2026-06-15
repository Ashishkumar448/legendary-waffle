"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Eye, Bell, BellOff, Trash2, Loader2, Shield, Globe, FileCode, Link as LinkIcon, Plus, AlertTriangle } from "lucide-react";
import PageHelp from "@/components/PageHelp";
import Link from "next/link";
import { format } from "date-fns";

type WatchlistItem = {
  id: string;
  iocValue: string;
  iocType: string;
  notes: string;
  emailAlerts: boolean;
  createdAt: string;
};

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemValue, setNewItemValue] = useState("");
  const [newItemType, setNewItemType] = useState("ip");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      if (!auth.currentUser) return;
      const q = query(collection(db, "watchlists"), where("userId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      const list: WatchlistItem[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as WatchlistItem));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(list);
    } catch (err) {
      console.error("Failed to fetch watchlist", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemValue.trim() || !auth.currentUser) return;
    setAdding(true);
    try {
      const docRef = await addDoc(collection(db, "watchlists"), {
        userId: auth.currentUser.uid,
        iocValue: newItemValue.trim(),
        iocType: newItemType,
        notes: "",
        emailAlerts: true,
        createdAt: new Date().toISOString()
      });
      setItems([{
        id: docRef.id,
        userId: auth.currentUser.uid,
        iocValue: newItemValue.trim(),
        iocType: newItemType,
        notes: "",
        emailAlerts: true,
        createdAt: new Date().toISOString()
      } as any, ...items]);
      setNewItemValue("");
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const toggleAlerts = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "watchlists", id), { emailAlerts: !currentStatus });
      setItems(items.map(item => item.id === id ? { ...item, emailAlerts: !currentStatus } : item));
    } catch (err) {
      console.error("Failed to toggle alerts", err);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm("Remove this IOC from your watchlist?")) return;
    try {
      await deleteDoc(doc(db, "watchlists", id));
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ip": return <Globe className="w-5 h-5 text-blue-400" />;
      case "hash": return <FileCode className="w-5 h-5 text-red-400" />;
      case "domain":
      case "url": return <LinkIcon className="w-5 h-5 text-amber-400" />;
      default: return <Shield className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Eye className="w-8 h-8 text-indigo-500" />
            Personal Watchlist
            <PageHelp title="Personal Watchlist" description="Monitor specific domains, IPs, or file hashes. If any of these IOCs are detected in new Threat Campaigns or telemetry logs, you will be alerted immediately via the Activity Feed." />
          </h1>
          <p className="text-zinc-400 mt-2 max-w-2xl">
            Pin critical IOCs or infrastructure you are tracking. Get alerted instantly if they are seen in new campaigns.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">Add to Watchlist</h3>
        <form onSubmit={handleAddItem} className="flex gap-4">
          <select 
            value={newItemType}
            onChange={(e) => setNewItemType(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ip">IP Address</option>
            <option value="domain">Domain</option>
            <option value="hash">File Hash</option>
          </select>
          <input 
            type="text" 
            placeholder="Enter IOC value to track..."
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            type="submit"
            disabled={adding || !newItemValue.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Track
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
          <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Your watchlist is empty.</p>
          <p className="text-sm mt-1">Start tracking IOCs to get automated alerts.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-5 hover:border-indigo-500/30 transition-colors group">
              <div className="w-12 h-12 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center">
                {getIcon(item.iocType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{item.iocType}</span>
                  <span className="text-xs text-zinc-600">•</span>
                  <span className="text-xs text-zinc-500">Added {format(new Date(item.createdAt), "MMM dd, yyyy")}</span>
                </div>
                <h3 className="text-lg font-mono font-bold text-zinc-100 truncate">{item.iocValue}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleAlerts(item.id, item.emailAlerts)}
                  className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium ${item.emailAlerts ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                  title={item.emailAlerts ? "Email Alerts Enabled" : "Email Alerts Disabled"}
                >
                  {item.emailAlerts ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{item.emailAlerts ? 'Alerts On' : 'Alerts Off'}</span>
                </button>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove from Watchlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
