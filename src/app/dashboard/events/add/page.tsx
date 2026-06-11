"use client";

import { useState, Suspense } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

function AddEventForm() {
  const [eventName, setEventName] = useState("");
  const [type, setType] = useState("network");
  const [status, setStatus] = useState("Active");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const orgId = userDoc.data()?.organizationId;

      await addDoc(collection(db, "threatEvents"), {
        eventName,
        type,
        status,
        isPublic, // If true, appears in Global Events feed for other orgs
        organizationId: orgId,
        createdBy: user.uid,
        events: [], // Array of IOCs added later
        iocStrings: [], // Flat array for fast correlation querying
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      router.push("/dashboard/events");
    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link 
        href="/dashboard/events" 
        className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
      </Link>
      
      <h1 className="text-2xl font-bold tracking-tight text-white">Create Threat Event</h1>
      <p className="text-zinc-400 mt-1">Initialize a new campaign to group your analyzed IOCs.</p>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Event Name (e.g. APT29 Campaign)</label>
          <input 
            type="text" 
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none text-white appearance-none"
            >
              <option value="network">Network</option>
              <option value="host">Host</option>
              <option value="email">Email</option>
              <option value="threatmap">Threat Map</option>
              <option value="misc">Misc</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none text-white appearance-none"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input 
            type="checkbox" 
            id="public" 
            checked={isPublic} 
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-blue-600 focus:ring-blue-600/50 focus:ring-offset-zinc-900"
          />
          <label htmlFor="public" className="text-sm text-zinc-300">Share globally (Allows external contributions and MITRE tagging)</label>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg text-sm transition-all flex items-center justify-center disabled:opacity-50 mt-4"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Create Event</>}
        </button>
      </form>
    </div>
  );
}

export default function AddEventPage() {
  return (
    <Suspense fallback={null}>
      <AddEventForm />
    </Suspense>
  );
}
