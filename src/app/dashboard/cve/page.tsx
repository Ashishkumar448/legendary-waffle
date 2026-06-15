"use client";

import { Bug, Search, ExternalLink } from "lucide-react";
import PageHelp from "@/components/PageHelp";

export default function CvePage() {
  const cves = [
    { id: "CVE-2021-44228", name: "Log4Shell", score: 10.0, vendor: "Apache", published: "2021-12-10", description: "JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints." },
    { id: "CVE-2023-34362", name: "MOVEit Transfer RCE", score: 9.8, vendor: "Progress Software", published: "2023-06-02", description: "SQL injection vulnerability in the MOVEit Transfer web application that could allow an unauthenticated attacker to gain unauthorized access." },
    { id: "CVE-2024-3400", name: "PAN-OS Command Injection", score: 10.0, vendor: "Palo Alto Networks", published: "2024-04-12", description: "A command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS software." },
    { id: "CVE-2021-34527", name: "PrintNightmare", score: 8.8, vendor: "Microsoft", published: "2021-07-01", description: "A remote code execution vulnerability exists when the Windows Print Spooler service improperly performs privileged file operations." }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Bug className="w-8 h-8 text-indigo-500" />
            CVE Vulnerability Tracker
            <PageHelp 
              title="CVE Tracker" 
              description="This table tracks common vulnerabilities and exposures (CVEs) that are actively being exploited in the Threat Campaigns logged in your database. High severity vulnerabilities are highlighted in red." 
            />
          </h1>
          <p className="text-zinc-400 mt-2">
            Track vulnerabilities associated with active threat campaigns and infrastructure.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center relative">
          <Search className="w-5 h-5 absolute left-7 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search CVE ID, vendor, or description..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-12 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/50 border-b border-zinc-800">
              <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">CVE ID</th>
              <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Name / Vendor</th>
              <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">CVSS Score</th>
              <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {cves.map(cve => (
              <tr key={cve.id} className="hover:bg-zinc-800/50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-zinc-100">{cve.id}</span>
                    <a href={`https://nvd.nist.gov/vuln/detail/${cve.id}`} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <span className="text-xs text-zinc-500 mt-1 block">Pub: {cve.published}</span>
                </td>
                <td className="p-4">
                  <div className="text-sm font-semibold text-zinc-200">{cve.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{cve.vendor}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-md ${
                      cve.score >= 9.0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      cve.score >= 7.0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {cve.score.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-xs text-zinc-400 leading-relaxed max-w-sm hidden md:table-cell">
                  {cve.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
