"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Send, Loader2 } from "lucide-react";

export default function ContributePage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [iocValue, setIocValue] = useState("");
  const [iocType, setIocType] = useState("domain");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      try {
        const eventDoc = await getDoc(doc(db, "threatEvents", id as string));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iocValue || !event || !auth.currentUser) return;
    setSubmitting(true);

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const myOrgId = userDoc.data()?.organizationId;

      await addDoc(collection(db, "contributions"), {
        targetEventId: id,
        targetOrganizationId: event.organizationId,
        contributorOrganizationId: myOrgId,
        contributorUserId: auth.currentUser.uid,
        status: "pending",
        proposedIOC: {
          value: iocValue,
          type: iocType,
          notes: notes,
          timestamp: new Date().toISOString()
        },
        createdAt: serverTimestamp()
      });

      alert("Contribution submitted successfully! Waiting for organization approval.");
      router.push(`/dashboard/events/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit contribution");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-zinc-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Propose Contribution</h1>
      <p className="text-zinc-400 mt-1">Submit an IOC to the <span className="text-blue-400 font-semibold">{event?.eventName}</span> campaign owned by another organization.</p>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">IOC Value</label>
          <input 
            type="text" 
            value={iocValue}
            onChange={(e) => setIocValue(e.target.value)}
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
        
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Type</label>
          <select
            value={iocType}
            onChange={(e) => setIocType(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none appearance-none"
          >
            <option value="domain">Domain</option>
            <option value="ip">IP</option>
            <option value="hash">Hash</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Reasoning / Context</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Why are you proposing this IOC?"
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center disabled:opacity-50 mt-4"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Submit Proposal</>}
        </button>
      </form>
    </div>
  );
}
