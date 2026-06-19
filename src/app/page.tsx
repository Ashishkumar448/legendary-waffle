"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ShieldAlert, Database, Network, BrainCircuit, Globe, Users, 
  TerminalSquare, Fingerprint, Activity, Zap, Lock, Eye, 
  Workflow, Radar, CheckCircle2, ServerCog, Bot, Crosshair,
  UploadCloud, Mail, Siren, Search, Share2, DownloadCloud,
  ChevronRight, ArrowRight
} from "lucide-react";

// Reusable FadeIn Component
const FadeIn = ({ children, delay = 0, className = "" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">IOCAG Web</span>
          </div>
          <Link href="/auth" className="px-5 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors border border-white/5">
            Login / Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Abstract Glowing Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-screen" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <Radar className="w-4 h-4" /> The Ultimate Threat Intelligence Center
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-8 leading-tight">
            Understand Cyber Threats Before They Become Incidents
          </h1>
          <p className="text-lg lg:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            IOCAG Web helps security teams collect suspicious domains, IP addresses, files, URLs, and threat reports from multiple intelligence sources, organize them into investigations, and generate actionable insights in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/10 flex items-center justify-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white flex items-center justify-center">
              View Platform
            </a>
          </div>
        </motion.div>
      </section>

      {/* Why IOCAG Section */}
      <section className="py-24 px-6 border-t border-white/5 bg-zinc-900/30" id="features">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-white mb-6 text-center">Why IOCAG?</h2>
            <p className="text-lg text-zinc-400 text-center max-w-3xl mx-auto mb-16 leading-relaxed">
              Modern cyber investigations often require analysts to switch between multiple websites, threat feeds, spreadsheets, and internal tools. <strong className="text-white font-medium">IOCAG brings everything together.</strong>
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Database, title: "Consolidated Intelligence", desc: "Submit information once and receive context from multiple global threat feeds automatically." },
              { icon: Zap, title: "Faster Investigations", desc: "Eliminate manual lookups. Get reputation data, threat context, and insights instantly." },
              { icon: Users, title: "Improved Collaboration", desc: "Work together across teams and organizations seamlessly within dedicated campaigns." }
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-indigo-500/30 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Blocks - Alternating Layout */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          
          {/* Collect */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
                  <UploadCloud className="w-4 h-4" /> Ingestion
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">Collect Threat Data From Anywhere</h2>
                <p className="text-lg text-zinc-400 leading-relaxed">IOCAG allows threat information to enter the platform through multiple channels, ensuring nothing slips through the cracks.</p>
                <ul className="space-y-4 mt-8">
                  {[
                    { title: "Manual Investigation", desc: "Submit suspicious domains, IPs, URLs, or hashes directly." },
                    { title: "Bulk Uploads", desc: "Upload CSV/JSON files to process thousands of indicators automatically." },
                    { title: "Email Intelligence", desc: "Forward phishing emails to automatically extract suspicious links." },
                    { title: "Security Tool Integrations", desc: "Receive SIEM webhooks and automatically start enrichment workflows." }
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <div className="mt-1 min-w-5 text-blue-400"><CheckCircle2 className="w-5 h-5" /></div>
                      <div>
                        <strong className="text-white block">{item.title}</strong>
                        <span className="text-zinc-400 text-sm">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
            <div className="flex-1 relative">
              <FadeIn delay={0.2} className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-8 flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2"><UploadCloud className="w-6 h-6 text-zinc-400"/> <span className="text-xs text-zinc-500">Bulk API</span></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2"><Mail className="w-6 h-6 text-zinc-400"/> <span className="text-xs text-zinc-500">IMAP Poller</span></div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2"><Siren className="w-6 h-6 text-zinc-400"/> <span className="text-xs text-zinc-500">SIEM Webhook</span></div>
                  <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 flex flex-col items-center justify-center gap-2"><TerminalSquare className="w-6 h-6 text-blue-400"/> <span className="text-xs text-blue-300">Manual Entry</span></div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Enrich & Organize */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-6">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
                  <Database className="w-4 h-4" /> Context & Correlation
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">Enrich & Organize Investigations</h2>
                <p className="text-lg text-zinc-400 leading-relaxed">Each submitted indicator is automatically analyzed. Since threats rarely exist in isolation, IOCAG allows analysts to group related indicators into Threat Events.</p>
                <div className="grid sm:grid-cols-2 gap-6 mt-8">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2"><Search className="w-4 h-4 text-emerald-400"/> Enrichment Data</h4>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      <li>• Reputation & trust scores</li>
                      <li>• Malware associations</li>
                      <li>• Open ports & services</li>
                      <li>• Threat intelligence refs</li>
                    </ul>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2"><Workflow className="w-4 h-4 text-emerald-400"/> Campaigns</h4>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      <li>• Add indicators in real time</li>
                      <li>• Maintain notes & context</li>
                      <li>• Track relationships</li>
                      <li>• Build attack pictures</li>
                    </ul>
                  </div>
                </div>
              </FadeIn>
            </div>
            <div className="flex-1 w-full">
              <FadeIn delay={0.2} className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center p-6 shadow-2xl">
                 <div className="w-full h-full rounded-2xl border border-white/5 bg-black/50 p-4 flex flex-col gap-3 font-mono text-xs text-zinc-500">
                    <div className="flex gap-2 border-b border-white/5 pb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div>$ iocag enrich --target 8.8.8.8</div>
                    <div className="text-emerald-400">[OK] Fetching from VirusTotal...</div>
                    <div className="text-emerald-400">[OK] Fetching from AbuseIPDB...</div>
                    <div className="text-emerald-400">[OK] Fetching from Shodan...</div>
                    <div className="text-emerald-400">[OK] Fetching from Frostbyte...</div>
                    <div className="mt-2 text-indigo-400">{`{`}</div>
                    <div className="pl-4 text-zinc-300">"ip": "8.8.8.8",</div>
                    <div className="pl-4 text-zinc-300">"reputation": "Safe",</div>
                    <div className="pl-4 text-zinc-300">"asn": "AS15169 Google LLC",</div>
                    <div className="pl-4 text-zinc-300">"open_ports": [53, 443]</div>
                    <div className="text-indigo-400">{`}`}</div>
                    <div className="mt-2 animate-pulse text-zinc-400">_</div>
                 </div>
              </FadeIn>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
                  <BrainCircuit className="w-4 h-4" /> Groq LLaMA3
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">AI-Powered Threat Analysis</h2>
                <p className="text-lg text-zinc-400 leading-relaxed">The goal is not to replace analysts, but to accelerate investigations and reduce manual work using cutting-edge artificial intelligence.</p>
                <div className="space-y-6 mt-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Fingerprint className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg">Threat Attribution</h4>
                      <p className="text-zinc-400 text-sm mt-1">AI analyzes behavioral patterns and available intelligence to identify similarities with known threat groups (APTs).</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <TerminalSquare className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg">Executive Reports</h4>
                      <p className="text-zinc-400 text-sm mt-1">Generate professional 3-paragraph summaries (Summary, Technical Analysis, Recommendations) designed for managers and stakeholders.</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
            <div className="flex-1 w-full">
               <FadeIn delay={0.2} className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-tr from-purple-900/40 to-black border border-purple-500/20 flex items-center justify-center p-8 shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)]" />
                  <Bot className="w-32 h-32 text-purple-400/50 absolute" />
                  <div className="z-10 w-full max-w-sm bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <BrainCircuit className="w-4 h-4 text-purple-400"/>
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">AI Analysis Complete</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full mb-2 overflow-hidden"><div className="h-full bg-purple-500 w-full"></div></div>
                    <p className="text-xs text-zinc-300 mb-2"><strong>Attribution Match:</strong> APT29 (Cozy Bear)</p>
                    <p className="text-xs text-zinc-400">Confidence: <span className="text-emerald-400">87%</span></p>
                    <p className="text-xs text-zinc-500 mt-3 border-t border-white/5 pt-3">Based on overlapping TTPs (T1059, T1134) and C2 infrastructure patterns matching historical campaigns.</p>
                  </div>
               </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of secondary features */}
      <section className="py-24 px-6 bg-zinc-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <FadeIn delay={0.1}>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400"><Network className="w-6 h-6"/></div>
                <h3 className="text-2xl font-bold text-white">Visualize Threat Activity</h3>
                <p className="text-zinc-400">Understanding large investigations becomes easier with visual tools. Includes interactive D3 threat graphs, attack timelines, global threat maps, and instant search-and-highlight capabilities.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400"><Users className="w-6 h-6"/></div>
                <h3 className="text-2xl font-bold text-white">Built for Teams</h3>
                <p className="text-zinc-400">Cyber investigations involve multiple analysts. Features isolated organization workspaces, shared contributions for cross-org intel, activity tracking, and granular Role-Based Access Control.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400"><Share2 className="w-6 h-6"/></div>
                <h3 className="text-2xl font-bold text-white">Import & Export</h3>
                <p className="text-zinc-400">Designed to work alongside existing security tools. Export intelligence instantly to CSV, JSON, or standard STIX 2.1 formats, and integrate directly with SIEM webhooks.</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Current Capabilities Checklist */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-12 text-center">Current Platform Capabilities</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Manual IOC Submission", "Bulk Upload & Auto Processing", "Email Intelligence Ingestion",
              "SIEM Webhook Intake", "Organization Multi-Tenancy", "Threat Events & Campaigns",
              "Cross-Org Contributions", "Global Events Feed", "AI Threat Attribution",
              "AI Executive Reporting", "Interactive Threat Graphs", "Search and Highlight",
              "Attack Timeline Reconstruction", "Personal Workspaces", "IOC-Centric Views",
              "Threat Actor Profiles", "MITRE ATT&CK Mapping", "Collaboration Features",
              "Audit Logs", "Role-Based Access Control", "Shodan Integration",
              "MITRE Auto-Tagging", "STIX 2.1 & CSV Exports"
            ].map((cap, i) => (
              <FadeIn key={i} delay={i * 0.03}>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-300 text-sm font-medium">{cap}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Future Roadmap Section (Visionary) */}
      <section className="py-32 px-6 bg-black relative border-t border-red-500/20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[200px] bg-red-500/10 blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-4">
              <Crosshair className="w-4 h-4" /> Unconstrained Enterprise Vision
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-6">Features Planned for Future Releases</h2>
            <p className="text-zinc-400 max-w-3xl mb-16 text-lg">The following features are part of the long-term vision and are currently <span className="text-red-400 font-semibold border-b border-red-400/30">not available</span> in the free-tier version.</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Live Autonomous SIEM", desc: "A native large-scale security monitoring engine capable of processing enterprise telemetry directly inside IOCAG." },
              { title: "Automated Incident Reporting", desc: "Automatically generate response plans and distribute them to affected teams and SOC developers." },
              { title: "Autonomous Zero-Touch Remediation", desc: "Direct integrations with security products capable of automatically blocking threats and isolating compromised systems." },
              { title: "Live AI Reverse Engineering", desc: "AI-assisted malware analysis capable of understanding binary behavior and execution flow." },
              { title: "In-House Sandboxing Environment", desc: "Secure, automated bare-metal malware execution environments for deep behavioral analysis." },
              { title: "Worldwide Honeypot Network", desc: "Distributed deception infrastructure designed to collect live zero-day attacker activity." },
              { title: "Autonomous Dark Web Monitoring", desc: "Automated discovery of leaked credentials and threat intelligence from dark web sources." },
              { title: "Hardware Accelerated 3D Graph", desc: "WebGPU millions-node relationship mapping using advanced rendering technologies and VR." }
            ].map((future, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-red-500/20 hover:border-red-500/50 transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">Planned</div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 pr-20 group-hover:text-red-400 transition-colors">{future.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{future.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-10">Who Is IOCAG For?</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Security Operations Centers (SOC)", "Threat Intelligence Teams", "Incident Response Teams",
                "Managed Security Service Providers", "Security Researchers", "Enterprise Security Programs",
                "Government & National CERT Teams"
              ].map((audience, i) => (
                <div key={i} className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all cursor-default">
                  {audience}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden p-12 text-center shadow-2xl border border-indigo-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-black -z-10" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay -z-10" />
              
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Turn scattered threat data into actionable intelligence.</h2>
              <p className="text-lg text-indigo-200 mb-10 max-w-2xl mx-auto">
                Collect, enrich, organize, analyze, and share cyber threat information from a single platform designed for modern security operations.
              </p>
              <Link href="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold bg-white text-indigo-950 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                Start Using IOCAG <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 text-center text-zinc-600 text-sm">
        <p>© {new Date().getFullYear()} IOCAG Web. Threat Intelligence Center.</p>
      </footer>
    </div>
  );
}
