# IOCAG Web - Quality Assurance Checklist

Use this checklist to verify that all features in the application are working correctly.

## 1. Authentication & Organizations
- [ ] **Email Registration:** Register a new user with Email/Password. Verify that an Organization is automatically created for them in the Firebase Console.
- [ ] **Google Sign-In:** Click the Google button and sign in. Verify that it routes to the dashboard and creates a new Organization for the Google user.
- [ ] **My Organization Dashboard:** Navigate to `/dashboard/organization`. Verify you see your organization name, your user listed as a member, and the settings toggle.

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

## 5. UI & Placeholders
- [ ] **Live Threat Map:** Go to `/dashboard/live-map` and verify the CheckPoint iframe loads and pulses.
- [ ] **Search:** Go to `/dashboard/search` and verify the placeholder page renders without error.
- [ ] **Graph Investigation:** Go to `/dashboard/graph` and verify the placeholder page renders without error.
- [ ] **Timeline:** Go to `/dashboard/timeline` and verify the placeholder renders.
- [ ] **What-If Sandbox:** Go to `/dashboard/what-if` and verify the placeholder renders.

## 6. Server/Background APIs
- [ ] **Email Sync API:** Send an email to your dedicated Gmail account containing a URL. Then, make a POST request (using Postman or curl) to `http://localhost:3000/api/email-sync`. Verify it returns `success: true`.
- [ ] **SIEM Webhook:** Make a POST request to `http://localhost:3000/api/webhook/siem` with a `Bearer` token matching your `.env` secret. Verify it returns `success: true`.
