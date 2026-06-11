import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const db = getFirestore();

    const config = {
      imap: {
        user: process.env.IMAP_USER || '',
        password: process.env.IMAP_PASSWORD || '',
        host: process.env.IMAP_HOST || '',
        port: parseInt(process.env.IMAP_PORT || '993'),
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    if (!config.imap.user || !config.imap.password) {
      return NextResponse.json({ error: "IMAP credentials missing in .env" }, { status: 400 });
    }

    console.log(`Connecting to IMAP at ${config.imap.host}...`);
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Fetch unread emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    console.log(`Found ${messages.length} unread emails.`);

    let processedCount = 0;
    const batch = db.batch();

    for (const item of messages) {
      const allParts = imaps.getParts(item.attributes.struct as any);
      const textPart = allParts.find((p: any) => p.partID === '1' || p.partID === 'TEXT');
      
      let rawEmail = '';
      const part = item.parts.find((p: any) => p.which === 'TEXT');
      if (part) {
        rawEmail = part.body;
      } else {
        rawEmail = item.parts[0].body;
      }

      // We use mailparser for safety if it's raw RFC822, but here we just have text.
      // If the email is complex, simpleParser helps.
      const parsed = await simpleParser(rawEmail);
      const emailText = parsed.text || parsed.html || String(rawEmail);
      const subject = parsed.subject || "Ingested Threat Report via Email";

      // Regex to extract IPs and Hashes
      const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
      const md5Regex = /\b[A-Fa-f0-9]{32}\b/g;
      const sha256Regex = /\b[A-Fa-f0-9]{64}\b/g;

      const ips = Array.from(new Set(emailText.match(ipRegex) || []));
      const md5s = Array.from(new Set(emailText.match(md5Regex) || []));
      const sha256s = Array.from(new Set(emailText.match(sha256Regex) || []));

      const iocs = [
        ...ips.map(ip => ({ ioc: ip, type: 'ip', description: 'Extracted from Email Body', timestamp: new Date().toISOString() })),
        ...md5s.map(h => ({ ioc: h, type: 'hash', description: 'Extracted from Email Body (MD5)', timestamp: new Date().toISOString() })),
        ...sha256s.map(h => ({ ioc: h, type: 'hash', description: 'Extracted from Email Body (SHA256)', timestamp: new Date().toISOString() }))
      ];

      if (iocs.length > 0) {
        const eventRef = db.collection('threatEvents').doc();
        batch.set(eventRef, {
          eventName: `[Email] ${subject}`,
          description: `Automatically ingested threat report. Extracted ${iocs.length} IOCs from the email body.\n\nPreview: ${emailText.substring(0, 200)}...`,
          isPublic: false,
          status: "Active",
          type: "Phishing",
          organizationId: "SYSTEM_INGEST",
          createdBy: "IMAP_Service",
          iocStrings: iocs.map(i => i.ioc),
          events: iocs,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        processedCount++;
      }
    }

    if (processedCount > 0) {
      await batch.commit();
    }

    connection.end();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${messages.length} emails. Created ${processedCount} new Threat Events.` 
    });

  } catch (error: any) {
    console.error('IMAP error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
