"use client";

import { useState, useRef, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, getDocs, query, where, updateDoc, arrayUnion } from "firebase/firestore";
import { Upload, FileUp, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import PageHelp from "@/components/PageHelp";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [destination, setDestination] = useState<"triage" | "campaign">("triage");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchCampaigns() {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const orgId = userDoc.data()?.organizationId;
        if (orgId) {
          const q = query(collection(db, "threatEvents"), where("organizationId", "==", orgId));
          const snap = await getDocs(q);
          setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
      }
    }
    fetchCampaigns();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccess(false);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file || !auth.currentUser) return;
    if (destination === "campaign" && !selectedCampaign) {
      setError("Please select a campaign to inject IOCs into.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess(false);

    try {
      const text = await file.text();
      // Split by newline or comma
      const rawIocs = text.split(/[\n,]+/).map(i => i.trim()).filter(i => i.length > 0);
      
      if (rawIocs.length === 0) {
        throw new Error("No valid IOCs found in file.");
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const orgId = userDoc.data()?.organizationId;

      if (destination === "triage") {
        // Send to Triage Queue
        const batchPromises = rawIocs.map(ioc => {
          let type = "unknown";
          if (ioc.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) type = "ip";
          else if (ioc.match(/^[a-fA-F0-9]{32,64}$/)) type = "hash";
          else if (ioc.includes(".")) type = "domain";

          return addDoc(collection(db, "triage_queue"), {
            value: ioc,
            type,
            status: "pending",
            organizationId: orgId,
            uploadedBy: auth.currentUser?.uid,
            createdAt: new Date().toISOString()
          });
        });
        
        await Promise.all(batchPromises);
      } else {
        // Send directly to Campaign
        const newIocs = rawIocs.map(ioc => {
          let type = "unknown";
          if (ioc.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) type = "ip";
          else if (ioc.match(/^[a-fA-F0-9]{32,64}$/)) type = "hash";
          else if (ioc.includes(".")) type = "domain";

          return {
            value: ioc,
            type,
            source: "Bulk Upload",
            dateAdded: new Date().toISOString()
          };
        });

        const campaignRef = doc(db, "threatEvents", selectedCampaign);
        await updateDoc(campaignRef, {
          iocs: arrayUnion(...newIocs)
        });
      }

      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Failed to process upload.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Upload className="w-8 h-8 text-indigo-500" />
          Bulk Upload
          <PageHelp title="Bulk Upload" description="Upload a CSV or TXT file containing multiple IOCs (IPs, domains, hashes). You can send them to the Triage Queue for manual review, or inject them directly into an existing Threat Campaign." />
        </h1>
        <p className="text-zinc-400 mt-2">
          Upload a CSV or TXT file containing multiple IOCs. You can route them to the Triage Queue for review, or inject them directly into an active campaign.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">Destination</label>
            <div className="flex gap-4">
              <label className={`flex-1 border rounded-xl p-4 cursor-pointer transition-colors ${destination === 'triage' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                <input type="radio" name="dest" value="triage" checked={destination === 'triage'} onChange={() => setDestination("triage")} className="hidden" />
                <div className="font-bold text-white">Triage Queue</div>
                <div className="text-xs text-zinc-500 mt-1">Review IOCs manually before accepting them.</div>
              </label>
              
              <label className={`flex-1 border rounded-xl p-4 cursor-pointer transition-colors ${destination === 'campaign' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}>
                <input type="radio" name="dest" value="campaign" checked={destination === 'campaign'} onChange={() => setDestination("campaign")} className="hidden" />
                <div className="font-bold text-white">Direct to Campaign</div>
                <div className="text-xs text-zinc-500 mt-1">Bypass triage and inject immediately.</div>
              </label>
            </div>
          </div>

          {destination === "campaign" && (
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">Target Campaign</label>
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
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">File Upload (CSV/TXT)</label>
            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center hover:border-indigo-500 transition-colors bg-zinc-950/50">
              <input 
                type="file" 
                accept=".csv,.txt" 
                onChange={handleFileChange}
                className="hidden" 
                id="file-upload"
                ref={fileInputRef}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                <FileUp className="w-12 h-12 text-zinc-500 mb-4" />
                <span className="text-zinc-300 font-medium">Click to browse or drag and drop</span>
                <span className="text-zinc-500 text-sm mt-1">CSV or plain text files only</span>
              </label>
              {file && (
                <div className="mt-4 inline-block bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-500/30">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg flex items-center gap-3 text-sm">
              <CheckCircle className="w-5 h-5" />
              Successfully processed file. {destination === 'triage' ? 'IOCs are now in the Triage Queue.' : 'IOCs have been injected into the campaign.'}
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800">
            <button 
              onClick={handleUpload}
              disabled={!file || processing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {processing ? "Processing..." : "Upload & Process"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
