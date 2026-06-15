"use client";
import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

export default function PageHelp({ title, description }: { title: string, description: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-full transition-colors ml-2"
        title={`Help for ${title}`}
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                How to use {title}
              </h3>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
              {description}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
              <button 
                onClick={() => setOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
