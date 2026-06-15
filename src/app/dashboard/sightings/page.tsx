"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { Crosshair, Loader2, Plus, Server, Globe } from "lucide-react";
import { format } from "date-fns";
import PageHelp from "@/components/PageHelp";

export default function SightingsPage() {
  const [sightings, setSightings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [newIoc, setNewIoc] = useState("");
  const [newSensor, setNewSensor] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    fetchSightings();
  }, []);

  const fetchSightings = async () => {
    if (!auth.currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const orgId = userDoc.data()?.organizationId;
      
      if (orgId) {
        const sQuery = query(collection(db, "sightings"), where("organizationId", "==", orgId));
        const snap = await getDocs(sQuery);
        const list: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setSightings(list);
      }
    } catch (err) {
      console.error("Failed to fetch sightings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSighting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIoc || !newSensor || !auth.currentUser) return;
    setProcessing(true);
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const orgId = userDoc.data()?.organizationId;

      const sighting = {
        iocValue: newIoc,
        sensorName: newSensor,
        notes: newNotes,
        organizationId: orgId,
        reportedBy: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "sightings"), sighting);
      setSightings([{ id: docRef.id, ...sighting }, ...sightings]);
      
      setShowModal(false);
      setNewIoc("");
      setNewSensor("");
      setNewNotes("");
    } catch (err) {
      console.error("Failed to add sighting", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Crosshair className="w-8 h-8 text-indigo-500" />
            Local Telemetry Sightings
            <PageHelp title="Local Telemetry Sightings" description="Record and review internal sensor hits (Firewall, EDR, Proxy) against known indicators. This helps you track which malicious IOCs are actively hitting your network." />
          </h1>
          <p className="text-zinc-400 mt-2">
            Record and review internal sensor hits (Firewall, EDR, Proxy) against known indicators.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Log Sighting
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
      ) : sightings.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
          <Server className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">No telemetry data</h3>
          <p className="text-sm text-zinc-500 mt-1">No internal sensor hits have been logged yet.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Timestamp</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Indicator</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sensor / Source</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Context Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sightings.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4 text-sm text-zinc-300 whitespace-nowrap">
                    {format(new Date(item.timestamp), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                      {item.iocValue}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Server className="w-4 h-4 text-indigo-400" />
                      {item.sensorName}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-zinc-500 max-w-xs truncate">
                    {item.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Sighting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-indigo-400" /> Log Sighting
              </h3>
            </div>
            <form onSubmit={handleAddSighting} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">Indicator (IP/Domain/Hash)</label>
                <input 
                  type="text" 
                  value={newIoc}
                  onChange={e => setNewIoc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. 104.18.2.1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">Sensor Name</label>
                <input 
                  type="text" 
                  value={newSensor}
                  onChange={e => setNewSensor(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Palo Alto Perimeter FW"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">Context / Notes</label>
                <textarea 
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Additional context on the traffic observed..."
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={processing || !newIoc || !newSensor}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Sighting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
