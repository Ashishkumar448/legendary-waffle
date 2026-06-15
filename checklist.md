# IOCAG Web - Quality Assurance Checklist

Use this checklist to verify that all features in the application are working correctly.

## 1. Authentication & Organizations
- [ ] **Email Registration:** Register a new user with Email/Password. Verify that an Organization is automatically created for them in the Firebase Console.
- [ ] **Google Sign-In:** Click the Google button and sign in. Verify that it routes to the dashboard and creates a new Organization for the Google user.
- [ ] **My Organization Dashboard:** Navigate to `/dashboard/organization`. Verify you see your organization name, your user listed as a member, and the settings toggle.
- [ ] **Role-Based Access Control (RBAC):** As an admin, change a member's role to Analyst or Viewer.

## 2. Core Enrichment
- [ ] **Manual Submission:** Navigate to the Manual Enrichment page.
- [ ] Enter a known malicious hash (e.g., `44d88612fea8a8f36de82e1278abb02f`) and verify results from VirusTotal, MalwareBazaar, and AlienVault OTX.
- [ ] Enter a known bad IP (e.g., `8.8.8.8`) and verify results from AbuseIPDB.
- [ ] **Bulk Upload:** Go to `/dashboard/bulk`. Upload a sample CSV containing 2-3 IPs or hashes. Verify that the table populates with the parsed IOCs.

## 3. Threat Events (Campaigns)
- [ ] **Create Event:** Go to `Global Threat Events` -> `New Event`. Name it "Test Campaign", check "Share globally", and click Create.
- [ ] **Event Details:** Open "Test Campaign". Under "Add IOC to Campaign", type a domain (e.g., `test.com`), select "Domain", and click Add. Verify it appears in the list below.

## 4. Cross-Organization Collaboration
> *Note: This requires logging in with two different accounts.*
- [ ] **Account A:** Create a public Threat Event called "Org A Campaign".
- [ ] **Account B:** Go to `Global Threat Events`. Click on "Org A Campaign".
- [ ] **Propose IOC:** Click "Propose Contribution". Enter a fake IP (e.g., `1.1.1.1`), add a note, and submit.
- [ ] **Approve Contribution:** Switch back to **Account A**. Go to the `Contributions Inbox`. You should see the pending IP from Account B. Click "Approve". 
- [ ] **Verification:** Go back to "Org A Campaign" and verify that `1.1.1.1` is now in the official IOC list!

## 5. Advanced Tools & Visualizations
- [ ] **Live Threat Map:** Go to `/dashboard/live-map` and verify the CheckPoint iframe loads and pulses.
- [ ] **Lightning Global Search:** Go to `/dashboard/search`. Type a partial domain or campaign name. Verify results appear instantly, accommodating minor typos.
- [ ] **Graph Investigation:** Go to `/dashboard/graph`. Verify the force-directed physics engine loads and that you can drag nodes around.
- [ ] **What-If Sandbox Contagion:** Go to `/dashboard/what-if`. Click a node to make it "Patient Zero", adjust the Infection Rate slider, and click "Start Simulation". Verify the visual spread animation.
- [ ] **SIEM Active Defense:** Go to a Campaign, click an IOC, and click the red "Push to Active Defense" button. Then navigate to `/dashboard/siem` and verify the IOC was added to the active firewall ledger.

## 6. Server/Background APIs
- [ ] **Email Sync API:** Send an email to your dedicated Gmail account containing a URL. Then, make a POST request (using Postman or curl) to `http://localhost:3000/api/email-sync`. Verify it returns `success: true`.
- [ ] **SIEM Webhook:** Make a POST request to `http://localhost:3000/api/webhook/siem` with a `Bearer` token matching your `.env` secret. Verify it returns `success: true`.

## 7. Advanced Capabilities
- [ ] **Shodan IP Context:** Add an IP address to a Campaign. Verify Shodan enrichment returns OS, ports, or vulnerabilities.
- [ ] **MITRE Auto-Tagging:** Add a known malicious hash or domain. Verify purple MITRE tags appear on the IOC card.
- [ ] **STIX 2.1 Export:** Open a Campaign, click Export -> STIX 2.1. Verify the `.json` bundle downloads and is correctly formatted.

## 8. CTI Expansion Features (Phase 2-5)
- [ ] **Watchlist:** Go to `/dashboard/watchlist`. Add an IOC and verify it appears. Toggle the email alert button.
- [ ] **Activity Feed:** Go to `/dashboard/activity`. Verify recent organizational actions (like IOC additions) appear.
- [ ] **Daily Briefing:** Go to `/dashboard/briefing`. Verify the dashboard loads your statistics correctly.
- [ ] **Threat Intel Views:** Visit `/dashboard/actors`, `/dashboard/mitre-matrix`, `/dashboard/cve`, and `/dashboard/geo` to verify the new UI placeholders render properly.
- [ ] **IOC-Centric Views:** Visit `/dashboard/triage`, `/dashboard/sightings`, and `/dashboard/compare` to verify navigation and layout.
- [ ] **Collaboration & Reporting:** Visit `/dashboard/reports` and `/dashboard/audit`.
- [ ] **Public Share Links:** Trigger a share link generation and navigate to `/share/[token]` to verify the read-only page loads.
