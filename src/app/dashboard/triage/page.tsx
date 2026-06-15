"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from "firebase/firestore";
import { Filter, Loader2, CheckSquare, Square, ArrowRightCircle, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import PageHelp from "@/components/PageHelp";

type TriageItem = {
  id: string;
  value: string;
  type: string;
  createdAt: string;
  uploadedBy: string;
};

export default function TriagePage() {
  const [items, setItems] = useState<TriageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const orgId = userDoc.data()?.organizationId;
      
      if (orgId) {
        // Fetch triage items
        const tQuery = query(collection(db, "triage_queue"), where("organizationId", "==", orgId), where("status", "==", "pending"));
        const tSnap = await getDocs(tQuery);
        setItems(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TriageItem)));

        // Fetch campaigns for the modal
        const cQuery = query(collection(db, "threatEvents"), where("organizationId", "==", orgId));
        const cSnap = await getDocs(cQuery);
        setCampaigns(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      console.error("Failed to fetch triage data", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelected(newSet);
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const handleDiscard = async () => {
    if (!confirm(`Discard ${selected.size} IOC(s)?`)) return;
    setProcessing(true);
    try {
      const promises = Array.from(selected).map(id => deleteDoc(doc(db, "triage_queue", id)));
      await Promise.all(promises);
      setItems(items.filter(i => !selected.has(i.id)));
      setSelected(new Set());
    } catch (err) {
      console.error("Failed to discard items", err);
    } finally {
      setProcessing(false);
    }
  };

  const handlePromote = async () => {
    if (!selectedCampaign || selected.size === 0) return;
    setProcessing(true);
    try {
      const itemsToPromote = items.filter(i => selected.has(i.id));
      
      const newIocs = itemsToPromote.map(item => ({
        value: item.value,
        type: item.type,
        source: "Triage Queue",
        dateAdded: new Date().toISOString()
      }));

      // Add to campaign
      const campaignRef = doc(db, "threatEvents", selectedCampaign);
      await updateDoc(campaignRef, { iocs: arrayUnion(...newIocs) });

      // Remove from triage queue
      const deletePromises = itemsToPromote.map(i => deleteDoc(doc(db, "triage_queue", i.id)));
      await Promise.all(deletePromises);

      setItems(items.filter(i => !selected.has(i.id)));
      setSelected(new Set());
      setShowModal(false);
    } catch (err) {
      console.error("Failed to promote items", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Filter className="w-8 h-8 text-indigo-500" />
            Triage Queue
            <PageHelp title="Triage Queue" description="Review bulk-uploaded IOCs and suspicious telemetry hits before officially promoting them to active Campaigns. Select multiple items to promote them in a single batch." />
          </h1>
          <p className="text-zinc-400 mt-2">
            Review bulk-uploaded IOCs and suspicious telemetry before officially promoting them to active Campaigns.
          </p>
        </div>
        
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-xl">
            <span className="text-sm font-medium text-indigo-300">{selected.size} selected</span>
            <div className="h-4 w-px bg-indigo-500/30" />
            <button 
              onClick={() => setShowModal(true)}
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
            >
              <ArrowRightCircle className="w-4 h-4" /> Promote
            </button>
            <button 
              onClick={handleDiscard}
              className="text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Discard
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
          <Filter className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">Queue is empty</h3>
          <p className="text-sm text-zinc-500 mt-1">No pending IOCs to review.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="p-4 w-12">
                  <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-white">
                    {selected.size === items.length ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                  </button>
                </th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Indicator Value</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {items.map(item => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-zinc-800/50 transition-colors cursor-pointer ${selected.has(item.id) ? 'bg-indigo-500/5' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <td className="p-4">
                    <div className="text-zinc-400">
                      {selected.has(item.id) ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm text-zinc-100">{item.value}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-md text-zinc-300 uppercase tracking-wider font-bold">
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-500">
                    {item.createdAt ? format(new Date(item.createdAt), "MMM dd, HH:mm") : "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Promotion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Promote IOCs</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-400">
                You are about to move <strong>{selected.size}</strong> indicator(s) from the Triage Queue into an active Threat Campaign.
              </p>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Target Campaign</label>
                <select 
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a campaign...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.eventName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePromote}
                disabled={!selectedCampaign || processing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
