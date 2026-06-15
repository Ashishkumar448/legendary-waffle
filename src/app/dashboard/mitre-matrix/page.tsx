"use client";

import { Grid, Loader2, ShieldAlert } from "lucide-react";
import PageHelp from "@/components/PageHelp";

export default function MitrePage() {
  const tactics = [
    { id: "TA0001", name: "Initial Access", techniques: ["T1189 Drive-by Compromise", "T1190 Exploit Public-Facing App", "T1566 Phishing"] },
    { id: "TA0002", name: "Execution", techniques: ["T1059 Command and Scripting Interpreter", "T1204 User Execution", "T1053 Scheduled Task/Job"] },
    { id: "TA0003", name: "Persistence", techniques: ["T1098 Account Manipulation", "T1136 Create Account", "T1546 Event Triggered Execution"] },
    { id: "TA0004", name: "Privilege Escalation", techniques: ["T1548 Abuse Elevation Control Mechanism", "T1134 Access Token Manipulation", "T1543 Create or Modify System Process"] },
    { id: "TA0005", name: "Defense Evasion", techniques: ["T1140 Deobfuscate/Decode Files or Information", "T1070 Indicator Removal", "T1202 Indirect Command Execution"] }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Grid className="w-8 h-8 text-indigo-500" />
            MITRE ATT&CK Matrix
            <PageHelp 
              title="MITRE Matrix" 
              description="This visual grid maps the Tactics and Techniques observed across all your organization's Threat Campaigns. Highlighted cells indicate techniques that have been actively tagged to your IOCs." 
            />
          </h1>
          <p className="text-zinc-400 mt-2">
            Enterprise techniques mapped against your organizational threat events.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto shadow-xl">
        <div className="flex min-w-[1000px]">
          {tactics.map(tactic => (
            <div key={tactic.id} className="flex-1 min-w-[200px] border-r border-zinc-800 last:border-0">
              <div className="bg-zinc-950 p-4 border-b border-zinc-800 text-center h-20 flex items-center justify-center">
                <div>
                  <div className="text-xs font-mono text-indigo-400 mb-1">{tactic.id}</div>
                  <div className="font-bold text-zinc-100 text-sm leading-tight">{tactic.name}</div>
                </div>
              </div>
              <div className="p-3 space-y-2 bg-zinc-900/50">
                {tactic.techniques.map((tech, i) => {
                  // Mock some random highlights
                  const isHighlighted = Math.random() > 0.6;
                  return (
                    <div 
                      key={i} 
                      className={`text-xs p-3 rounded border transition-colors ${
                        isHighlighted 
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-medium cursor-pointer hover:bg-indigo-500/30' 
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {tech}
                    </div>
                  );
                })}
                <div className="h-10"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
