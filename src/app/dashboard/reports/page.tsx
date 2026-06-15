"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { FileText, Loader2, Printer, Download, ShieldCheck } from "lucide-react";
import PageHelp from "@/components/PageHelp";
import { format } from "date-fns";

export default function ReportsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="print:hidden border-b border-zinc-800 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-500" />
            Executive Reports Center
            <PageHelp 
              title="Reports Center" 
              description="Select a Threat Campaign to generate a beautifully formatted, printable intelligence brief. You can export this directly to PDF via your browser's print function." 
            />
          </h1>
          <p className="text-zinc-400 mt-2">
            Generate and export formatted PDF briefings for active campaigns.
          </p>
        </div>
        
        {selectedCampaign && (
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 print:hidden"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar - Hidden during print */}
          <div className="lg:col-span-1 space-y-4 print:hidden">
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm text-zinc-500">Select Campaign</h3>
            <div className="space-y-2">
              {campaigns.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaign(c)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedCampaign?.id === c.id 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-white' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-semibold text-sm truncate">{c.eventName}</div>
                  <div className="text-xs text-zinc-500 mt-1">{c.iocs?.length || 0} Indicators</div>
                </button>
              ))}
            </div>
          </div>

          {/* Report Canvas */}
          <div className="lg:col-span-3">
            {selectedCampaign ? (
              <div className="bg-white text-black p-10 rounded-2xl shadow-2xl print:shadow-none print:p-0">
                <div className="border-b-4 border-indigo-600 pb-6 mb-8 flex justify-between items-end">
                  <div>
                    <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">Threat Intelligence Brief</h2>
                    <h1 className="text-4xl font-extrabold">{selectedCampaign.eventName}</h1>
                  </div>
                  <div className="text-right">
                    <ShieldCheck className="w-12 h-12 text-indigo-600 ml-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Generated: {format(new Date(), "PPpp")}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-4">Executive Summary</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedCampaign.description || "No description provided for this campaign. This report outlines the technical indicators of compromise associated with this active threat event."}
                    </p>
                  </section>

                  <div className="grid grid-cols-2 gap-8">
                    <section>
                      <h3 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-4">Attribution & Context</h3>
                      <ul className="space-y-3 text-sm text-gray-700">
                        <li><strong>Status:</strong> {selectedCampaign.status || "Active"}</li>
                        <li><strong>Confidence:</strong> High</li>
                        <li><strong>Visibility:</strong> {selectedCampaign.isPublic ? "Publicly Disclosed" : "Internal Organization Only"}</li>
                        <li><strong>Date Created:</strong> {selectedCampaign.createdAt ? format(new Date(selectedCampaign.createdAt), "PP") : "Unknown"}</li>
                      </ul>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-4">Impact Metrics</h3>
                      <div className="bg-gray-50 p-6 rounded-xl text-center">
                        <div className="text-5xl font-black text-indigo-600 mb-2">{selectedCampaign.iocs?.length || 0}</div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Associated Indicators</div>
                      </div>
                    </section>
                  </div>

                  <section>
                    <h3 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-4">Technical Indicators of Compromise</h3>
                    {selectedCampaign.iocs && selectedCampaign.iocs.length > 0 ? (
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 border border-gray-300 font-bold">Indicator</th>
                            <th className="p-3 border border-gray-300 font-bold">Type</th>
                            <th className="p-3 border border-gray-300 font-bold">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCampaign.iocs.map((ioc: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="p-3 border border-gray-300 font-mono font-medium">{ioc.value}</td>
                              <td className="p-3 border border-gray-300 uppercase">{ioc.type}</td>
                              <td className="p-3 border border-gray-300">{ioc.source || "Unknown"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500 italic">No IOCs have been associated with this campaign yet.</p>
                    )}
                  </section>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-20 flex flex-col items-center justify-center text-center print:hidden">
                <FileText className="w-16 h-16 text-zinc-700 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No Campaign Selected</h2>
                <p className="text-zinc-500">Select a campaign from the sidebar to view and print its intelligence report.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
