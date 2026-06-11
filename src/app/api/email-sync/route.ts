import { NextResponse } from "next/server";
import { simpleParser } from "mailparser";
import imaps from "imap-simple";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const config = {
      imap: {
        user: process.env.IMAP_USER || "",
        password: process.env.IMAP_PASSWORD || "",
        host: process.env.IMAP_HOST || "imap.gmail.com",
        port: parseInt(process.env.IMAP_PORT || "993"),
        tls: true,
        authTimeout: 3000,
      }
    };

    if (!config.imap.user || !config.imap.password) {
      return NextResponse.json({ error: "IMAP configuration missing" }, { status: 500 });
    }

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Fetch unread emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };
    const results = await connection.search(searchCriteria, fetchOptions);

    let processedCount = 0;

    for (const item of results) {
      const all = item.parts.find((part) => part.which === 'TEXT');
      const id = item.attributes.uid;
      const idHeader = "Imap-Id: " + id + "\r\n";
      
      if (all && all.body) {
        const mail = await simpleParser(idHeader + all.body);
        
        // Basic naive extraction for demo purposes (extracting URLs)
        const text = mail.text || "";
        const urls = text.match(/https?:\/\/[^\s]+/g) || [];
        
        // Save to Firestore
        if (urls.length > 0) {
          await adminDb.collection("phishing_reports").add({
            sourceEmail: mail.from?.text || "Unknown",
            subject: mail.subject,
            extractedIOCs: urls,
            dateReported: new Date().toISOString(),
          });
          processedCount++;
        }
      }
    }

    connection.end();

    return NextResponse.json({ message: "Sync complete", emailsProcessed: processedCount });
  } catch (error: any) {
    console.error("IMAP Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
