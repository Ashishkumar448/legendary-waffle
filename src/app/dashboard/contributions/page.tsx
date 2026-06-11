"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { CheckCircle, XCircle, Inbox, Mail, Loader2 } from "lucide-react";

export default function ContributionsPage() {
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function fetchContributions() {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;

        const q = query(
          collection(db, "contributions"), 
          where("targetOrganizationId", "==", orgId)
        );
        const snapshot = await getDocs(q);
        const data = await Promise.all(snapshot.docs.map(async (d) => {
          const contrib = d.data();
          // Fetch event name for context
          const eventDoc = await getDoc(doc(db, "threatEvents", contrib.targetEventId));
          return { id: d.id, ...contrib, eventName: eventDoc.data()?.eventName };
        }));
        setContributions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchContributions();
  }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected', eventId: string, proposedIOC: any) => {
    try {
      const contribRef = doc(db, "contributions", id);
      await updateDoc(contribRef, { status: action });

      if (action === 'approved') {
        const eventRef = doc(db, "threatEvents", eventId);
        await updateDoc(eventRef, {
          events: arrayUnion(proposedIOC)
        });
      }

      setContributions(prev => prev.map(c => c.id === id ? { ...c, status: action } : c));
    } catch (err) {
      console.error(err);
      alert("Failed to process contribution");
    }
  };

  const handleSyncEmails = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/ingest-email');
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        window.location.reload();
      } else {
        alert("Error syncing emails: " + data.error);
      }
    } catch (e) {
      alert("Failed to sync emails.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="text-zinc-500">Loading inbox...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Contributions Inbox</h1>
        </div>
        <button 
          onClick={handleSyncEmails}
          disabled={syncing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Sync SOC Inbox
        </button>
      </div>
      <p className="text-zinc-400 mt-1">Review IOCs proposed by external organizations for your public Threat Events.</p>

      {contributions.filter(c => c.status === "pending").length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 shadow-xl">
          No pending contributions. You're all caught up!
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white mb-2">Pending Review</h2>
          {contributions.filter(c => c.status === "pending").map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Proposed IOC: <span className="text-purple-400">{c.proposedIOC.value}</span></h3>
                  <p className="text-sm text-zinc-400 mt-1">Target Campaign: <span className="text-blue-400">{c.eventName}</span></p>
                  <div className="bg-zinc-950 p-3 rounded mt-3 text-sm text-zinc-300 border border-zinc-800">
                    <span className="font-semibold text-zinc-500">Context/Notes:</span> {c.proposedIOC.notes}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleAction(c.id, 'approved', c.targetEventId, c.proposedIOC)}
                    className="flex items-center justify-center gap-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 py-2 px-4 rounded transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(c.id, 'rejected', c.targetEventId, c.proposedIOC)}
                    className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 py-2 px-4 rounded transition-colors text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {contributions.filter(c => c.status !== "pending").length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-2">History</h2>
          {contributions.filter(c => c.status !== "pending").map(c => (
            <div key={c.id} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 shadow opacity-75">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-medium text-zinc-300 line-through decoration-zinc-600">{c.proposedIOC.value}</h3>
                  <p className="text-xs text-zinc-500">Target: {c.eventName}</p>
                </div>
                <div>
                  {c.status === 'approved' ? (
                    <span className="flex items-center gap-1 text-green-500/70 text-xs font-bold uppercase"><CheckCircle className="w-3 h-3"/> Approved</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500/70 text-xs font-bold uppercase"><XCircle className="w-3 h-3"/> Rejected</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
