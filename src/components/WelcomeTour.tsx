"use client";
import { useState, useEffect } from "react";
import { X, ChevronRight, CheckCircle, ShieldAlert, Globe, Crosshair } from "lucide-react";

export default function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem("iocag_tour_seen");
    if (!hasSeen) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("iocag_tour_seen", "true");
    setOpen(false);
  };

  const steps = [
    {
      title: "Welcome to IOCAG Threat Intelligence",
      icon: <ShieldAlert className="w-12 h-12 text-indigo-500 mb-4" />,
      content: "This platform allows you to ingest, enrich, and analyze Indicators of Compromise (IOCs) across your entire organization in real-time."
    },
    {
      title: "Threat Events & Campaigns",
      icon: <Globe className="w-12 h-12 text-blue-500 mb-4" />,
      content: "Instead of dealing with loose IPs and domains, group them into Threat Events (Campaigns). You can share these globally or keep them private to your organization."
    },
    {
      title: "Triage & Bulk Ingestion",
      icon: <Crosshair className="w-12 h-12 text-red-500 mb-4" />,
      content: "Upload CSVs or stream data from your SIEM. It all lands in the Triage Queue for manual review before promoting to active campaigns."
    }
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-indigo-500/30 rounded-3xl w-full max-w-xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.5)] overflow-hidden relative text-center px-8 py-12 animate-in fade-in zoom-in-95 duration-500">
        <button onClick={handleClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          {steps[step].icon}
          <h2 className="text-2xl font-bold text-white mb-4">{steps[step].title}</h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-md mx-auto">
            {steps[step].content}
          </p>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-indigo-500' : 'w-2 bg-zinc-700'}`} />
            ))}
          </div>
          
          <button 
            onClick={() => {
              if (step < steps.length - 1) setStep(step + 1);
              else handleClose();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            {step < steps.length - 1 ? (
              <>Next <ChevronRight className="w-4 h-4" /></>
            ) : (
              <>Get Started <CheckCircle className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
