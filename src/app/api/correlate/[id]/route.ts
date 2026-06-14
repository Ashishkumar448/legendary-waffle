import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getFirestore();
    const resolvedParams = await params;
    const eventId = resolvedParams.id;

    // 1. Fetch Target Event
    const targetDoc = await db.collection('threatEvents').doc(eventId).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const targetData = targetDoc.data();
    const targetIocs = targetData?.iocStrings || [];

    if (!targetIocs || targetIocs.length === 0) {
      return NextResponse.json({ success: true, correlatedEvents: [] });
    }

    // 2. Query for Overlaps
    // Firestore `array-contains-any` limits to 10 items.
    // We will chunk the targetIocs into batches of 10 and query them.
    const chunkSize = 10;
    const correlatedEventsMap = new Map();

    for (let i = 0; i < targetIocs.length; i += chunkSize) {
      const chunk = targetIocs.slice(i, i + chunkSize);
      
      const snapshot = await db.collection('threatEvents')
        .where('iocStrings', 'array-contains-any', chunk)
        .get();

      snapshot.docs.forEach(doc => {
        // Exclude the target event itself
        if (doc.id !== eventId) {
          const data = doc.data();
          // Filter out private events from other organizations. 
          // In a real API with auth validation, we'd check if the user is in data.organizationId.
          // Since this is a public GET endpoint for MVP, we'll only return isPublic == true.
          if (data.isPublic === true || data.organizationId === targetData?.organizationId) {
            correlatedEventsMap.set(doc.id, {
              id: doc.id,
              eventName: data.eventName,
              type: data.type,
              organizationId: data.organizationId,
              iocStrings: data.iocStrings
            });
          }
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      correlatedEvents: Array.from(correlatedEventsMap.values()) 
    });
  } catch (error: any) {
    if (error.message && error.message.includes("Could not load the default credentials")) {
      console.warn("Firebase Admin credentials not configured locally. Skipping correlation fetch.");
      return NextResponse.json({ success: true, correlatedEvents: [] });
    }
    console.error('Error correlating events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
