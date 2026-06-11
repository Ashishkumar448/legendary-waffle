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

### Analysis
10. **Global Search:** Query previously analyzed IOCs stored in Firestore.
11. **Graph Investigation:** Interactive node-based visualization of relationships between IOCs.
12. **Attack Timeline Reconstruction:** Chronological view of IOC observations.
13. **"What-If" Sandbox:** Simulate relationships without polluting production feeds.

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
