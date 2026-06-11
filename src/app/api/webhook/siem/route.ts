import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    // Verify SIEM API Key (simple static check for demo)
    if (authHeader !== `Bearer ${process.env.SIEM_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized SIEM" }, { status: 401 });
    }

    const body = await req.json();
    const { indicator, type } = body;

    if (!indicator || !type) {
      return NextResponse.json({ error: "Missing indicator or type" }, { status: 400 });
    }

    // Example internal enrichment logic call to the Next.js API itself 
    // or direct internal service call. For demo, we just record the SIEM event.
    await adminDb.collection("siem_alerts").add({
      indicator,
      type,
      timestamp: new Date().toISOString(),
      rawPayload: body
    });

    return NextResponse.json({ 
      success: true, 
      message: "IOC received and queued for background enrichment.",
      recommendation: "Monitor"
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
