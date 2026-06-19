# IOCAG Web (Enterprise Threat Intelligence Center)

IOCAG Web is a modern Next.js application designed to streamline the gathering, enrichment, and analysis of Indicators of Compromise (IOCs). Built with React, Tailwind CSS, and Firebase, it provides analysts with a unified dashboard to interact with multiple OSINT APIs and advanced proprietary defense systems.

## Supported Features

The following features have been implemented to provide an unconstrained, enterprise-grade threat intelligence and remediation platform:

### Core Enrichment & Ingestion
1. **Manual IOC Submission:** Submit domains, IPs, hashes, or URLs for deep enrichment via VirusTotal, URLhaus, MalwareBazaar, AlienVault OTX, AbuseIPDB, and Frostbyte.
2. **Bulk Upload (Auto-Enrichment):** Upload CSV or JSON files to automatically enrich multiple IOCs in the background.
3. **Phishing Email Forwarding:** API endpoint (`/api/email-sync`) that uses IMAP to poll a dedicated Gmail inbox, parsing forwarded emails for URLs and storing them in the DB.
4. **SIEM / SOAR Webhook Push (Auto-Enrichment):** Dedicated API endpoint (`/api/webhook/siem`) to ingest alerts from your SIEM. Any ingested IOCs are automatically queued for background enrichment.
5. **Live Autonomous SIEM:** *(Not Implemented)* A native, real-time log ingestion engine capable of processing terabytes of syslog, netflow, and cloud trail data per second directly into custom hunting dashboards (Splunk/ELK alternative).

### Fully Automated SOAR & Remediation
6. **Automated Incident Reporting & Solution Generation:** *(Not Implemented)* Upon detecting a severe IOC, the platform uses advanced AI to instantly fetch context, generate tailored mitigation scripts, and automatically distribute actionable remediation playbooks via email to the SOC team and developers.
7. **Autonomous Zero-Touch Remediation:** *(Not Implemented)* Direct, two-way API integrations with enterprise firewalls (Palo Alto, Fortinet) and EDRs (CrowdStrike, SentinelOne) to autonomously push block rules and isolate compromised endpoints globally within milliseconds.

### Organizations & Collaboration
8. **Organization Multi-Tenancy:** Users belong to an Organization, keeping private Threat Events scoped and isolated. Admins can manage users and toggle Org-wide auto-enrichment settings.
9. **Threat Events (Campaigns):** Analysts can create Threat Events (e.g., APT campaigns) and upload IOCs directly into them. Added IOCs are automatically enriched in real-time.
10. **Global Events Feed:** Real-time dashboard showing publicly shared Threat Events and MITRE tagged campaigns.
11. **Cross-Organization Contributions:** Analysts from Org A can propose IOC additions to Threat Events owned by Org B. Org B admins can review and approve/reject these inside their Contributions Inbox.
12. **Live Threat Map:** Global real-time visualization of cyber attacks.

### AI & Machine Learning
13. **AI Threat Attribution Engine:** Powered by Groq/LLaMA3, automatically analyzes Campaign IOCs and MITRE tags to match behavioral patterns against known Advanced Persistent Threats (APTs) with confidence scoring.
14. **AI Executive Reporting:** Automatically generates highly professional, 3-paragraph executive threat narratives (Summary, Technical Analysis, Recommendations) for any Threat Campaign.
15. **Live AI Reverse Engineering:** *(Not Implemented)* Employs dedicated clusters of localized LLMs to instantly decompile obfuscated binaries, identify encryption routines, and map out the malware's exact execution flow.

### Advanced Threat Capture & Sandboxing
16. **In-House Bare-Metal Sandboxing:** *(Not Implemented)* An automated pipeline that safely detonates uploaded malicious files in highly instrumented, isolated virtual and physical environments to capture memory dumps and C2 traffic.
17. **Worldwide Deception Grid (Honeypots):** *(Not Implemented)* Deployment of thousands of interactive honeypots mimicking enterprise infrastructure to capture live zero-day exploits and ingest attacker TTPs automatically.
18. **Autonomous Dark Web Crawlers:** *(Not Implemented)* Custom scraping bots running 24/7, infiltrating Dark Web forums and ransomware leak sites to automatically alert the organization of leaked credentials or proprietary data.

### Analysis & Visualization
19. **Hardware-Accelerated 3D Threat Graphing:** *(Not Implemented)* Highly advanced, WebGPU-powered node-based correlation web capable of rendering millions of connected Threat Actors and IOCs in real-time without browser lag. Includes full VR Forensics Environment support.
20. **Interactive Graph Controls:** Built-in floating UI for directional Panning, precise Zooming, Auto-Fit centering, and 90° Canvas Rotation.
21. **Search & Highlight:** Real-time search bar that illuminates queried IOCs (in amber), their connected Campaigns (in orange), and fades out irrelevant data for forensic focus.
22. **Attack Timeline Reconstruction:** Chronological view of IOC observations.
23. **"What-If" Contagion Sandbox:** An interactive playground to simulate lateral movement and blast radius. Select a "Patient Zero" and watch a mathematical contagion algorithm probabilistically infect connected infrastructure.

### Advanced CTI Platform Expansion (Phases 2-5)
24. **Personal Workspaces:** Daily Intelligence Briefing, Watchlist with Alerting toggles, and Org-wide Activity Feeds.
25. **IOC-Centric Views:** Detailed IOC Pages, Triage Queue for bulk processing, Sightings Log for internal telemetry, and Side-by-side IOC Comparison.
26. **Threat Intelligence Views:** *(Not Implemented)* Threat Actor Profiles (Hybrid manual/API), MITRE ATT&CK Matrix Heatmap, CVE Tracker, and Global Geo Heatmap using Leaflet.
27. **Collaboration & Reporting:** Threaded Comments on IOCs, Public 24-Hour Share Links, PDF Reports Center, and immutable Audit Logs.
28. **Role-Based Access Control (RBAC):** Organization Admins can manage Analyst and Viewer permissions.

### Data Inputs & Details
29. **Contextual Enriched Events:** Campaigns and IOCs now support detailed Context notes, and feature interactive Modals for copying intelligence and warning of cross-campaign IOC correlations.
30. **Robust Email Ingestion:** IMAP processor correctly parses and ingests raw or multipart text emails directly into the DB.
31. **Lightning Global Search:** An instantaneous, client-side fuzzy search engine (powered by Fuse.js) that handles typos and instantly searches across thousands of IOCs and Campaigns without backend delays.
32. **Shodan Integration:** Deep infrastructure scanning for IPs including open ports, banners, and vulnerabilities.
33. **MITRE ATT&CK Auto-Tagging:** AlienVault OTX integration extracts and automatically tags IOCs with official MITRE technique badges.
34. **STIX 2.1 & CSV Exports:** Pure client-side compute engine to instantly export threat campaigns into STIX 2.1 JSON bundles or flat CSVs.

## Setup Instructions

1. **Clone & Install:**
   ```bash
   npm install
   ```
2. **Configure Environment:**
   Duplicate the provided `.env` structure and fill in your Firebase API keys and Threat Intel (VirusTotal, etc.) API keys.
3. **Run Development Server:**
   ```bash
   npm run dev
   ```

## Tech Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS & Lucide Icons
- Firebase (Auth, Firestore)
- Firebase Admin (Server-side verification and DB operations)
- imap-simple & mailparser (Email ingestion)
- WebGPU *(Not Implemented)* & D3.js (Advanced Physics and Visualization)
- Dedicated LLM Clusters *(Not Implemented)* (AI Reverse Engineering)
