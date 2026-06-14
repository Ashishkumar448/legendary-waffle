# IOCAG Web (Threat Intelligence Center)

IOCAG Web is a modern Next.js application designed to streamline the gathering, enrichment, and analysis of Indicators of Compromise (IOCs). Built with React, Tailwind CSS, and Firebase, it provides analysts with a unified dashboard to interact with multiple OSINT APIs.

## Supported Features (Free Tier Compatible)

The following features have been implemented and are fully compatible with free tier infrastructure (Firebase Spark Plan, Free API limits, and Vercel/Next.js limits):

### Core Enrichment
1. **Manual IOC Submission:** Submit domains, IPs, hashes, or URLs for deep enrichment via VirusTotal, URLhaus, MalwareBazaar, AlienVault OTX, and AbuseIPDB.
2. **Bulk Upload:** Upload CSV or JSON files to enrich multiple IOCs (sequential processing to respect API rate limits).
3. **Phishing Email Forwarding:** API endpoint (`/api/email-sync`) that uses IMAP to poll a dedicated Gmail inbox, parsing forwarded emails for URLs and storing them in the DB.
4. **SIEM / SOAR Webhook Push:** Dedicated API endpoint (`/api/webhook/siem`) to ingest alerts from your SIEM.

### Organizations & Collaboration (Phase 2)
5. **Organization Multi-Tenancy:** Users belong to an Organization, keeping private Threat Events scoped and isolated.
6. **Threat Events (Campaigns):** Analysts can create Threat Events (e.g., APT campaigns) and upload IOCs directly into them rather than dumping them loosely.
7. **Global Events Feed:** Real-time dashboard showing publicly shared Threat Events and MITRE tagged campaigns.
8. **Cross-Organization Contributions:** Analysts from Org A can propose IOC additions to Threat Events owned by Org B. Org B admins can review and approve/reject these inside their Contributions Inbox.
9. **Live Threat Map:** Global real-time visualization of cyber attacks.

### Analysis & Visualization
10. **Graph Investigation (Enhanced):** Highly advanced, interactive node-based correlation web.
    - **Physics Engine:** Custom D3 force logic automatically centers disconnected campaigns and spreads massive highly-connected datasets without overlapping.
    - **Interactive Controls:** Built-in floating UI for directional Panning, precise Zooming, Auto-Fit centering, and 90° Canvas Rotation.
    - **Search & Highlight:** Real-time search bar that illuminates queried IOCs (in amber), their connected Campaigns (in orange), and fades out irrelevant data for forensic focus.
11. **Attack Timeline Reconstruction:** Chronological view of IOC observations.
12. **"What-If" Contagion Sandbox:** An interactive playground to simulate lateral movement and blast radius. Select a "Patient Zero" and watch a mathematical contagion algorithm probabilistically infect connected infrastructure.

### Data Inputs & Details
13. **Contextual Enriched Events:** Campaigns and IOCs now support detailed Context notes, and feature interactive Modals for copying intelligence and warning of cross-campaign IOC correlations.
32. **Robust Email Ingestion:** IMAP processor correctly parses and ingests raw or multipart text emails directly into the DB.
33. **Lightning Global Search:** An instantaneous, client-side fuzzy search engine (powered by Fuse.js) that handles typos and instantly searches across thousands of IOCs and Campaigns without backend delays.
34. **Active Defense SIEM Dashboard:** A mock Security Operations Center (SOC) view featuring live metrics, a simulated firewall syslog terminal, and a real-time blocklist ledger tracking every IOC "Pushed to Defense".
35. **Shodan Integration:** Deep infrastructure scanning for IPs including open ports, banners, and vulnerabilities.
36. **MITRE ATT&CK Auto-Tagging:** AlienVault OTX integration extracts and automatically tags IOCs with official MITRE technique badges.
37. **STIX 2.1 & CSV Exports:** Pure client-side compute engine to instantly export threat campaigns into STIX 2.1 JSON bundles or flat CSVs.

## Excluded Features

The following features from the original specification were **omitted** as they require paid infrastructure, complex background workers, or exceed serverless capabilities:

- **Malware Sample Upload & Detonation:** Requires an expensive live sandbox environment (e.g., Cuckoo or Any.Run commercial APIs).
- **Automated Watchlist / Alerting:** Continuous background polling and alerting requires Firebase Cloud Functions (only available on the paid Blaze plan) or dedicated cron servers.
- **Browser Extension w/ Screenshots:** Rendering screenshots of malicious domains requires headless Chrome environments, which exceed free serverless function size and timeout limits.
- **Honeypot Infrastructure:** Requires maintaining live VM honeypots to capture C2 traffic.

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
