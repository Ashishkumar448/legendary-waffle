import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin is not configured. Missing FIREBASE_PRIVATE_KEY in Vercel." }, { status: 500 });
    }

    const eventsToCreate = [];

    // 0. Clean up old synced events to prevent duplicates
    console.log("Cleaning up old sync data...");
    const oldEventsSnap = await db.collection('threatEvents').where('organizationId', 'in', ['MITRE_CORP', 'ALIENVAULT_OTX']).get();
    const deleteBatch = db.batch();
    oldEventsSnap.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();

    // 1. Fetch Real MITRE STIX 2.1 Data
    console.log("Fetching MITRE CTI Data...");
    try {
      const mitreRes = await fetch('https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json');
      const stixData = await mitreRes.json();
      
      // Extract all necessary object types
      const aptGroups = stixData.objects.filter((o: any) => o.type === 'intrusion-set');
      const relationships = stixData.objects.filter((o: any) => o.type === 'relationship');
      const attackPatterns = stixData.objects.filter((o: any) => o.type === 'attack-pattern');
      
      // Randomly select 15 APT groups to sync
      const shuffledApts = aptGroups.sort(() => 0.5 - Math.random()).slice(0, 15);

      for (const apt of shuffledApts) {
        const extRef = apt.external_references?.[0];
        const aptUrl = extRef?.url || "https://attack.mitre.org";
        const aptId = apt.id;

        // Find techniques used by this APT group
        const aptRels = relationships.filter((r: any) => r.source_ref === aptId);
        const techniqueIds = aptRels.map((r: any) => r.target_ref);
        
        const usedTechniques = attackPatterns
          .filter((ap: any) => techniqueIds.includes(ap.id))
          .slice(0, 8); // Limit to 8 techniques to keep it manageable

        const iocStrings = [aptUrl];
        const eventsList = [
          {
            ioc: aptUrl,
            type: "url",
            mitreId: extRef?.external_id || "Unknown",
            timestamp: new Date().toISOString(),
            description: "MITRE ATT&CK Group Reference"
          }
        ];

        usedTechniques.forEach((tech: any) => {
          const techExtRef = tech.external_references?.find((er: any) => er.source_name === 'mitre-attack');
          const techName = `${techExtRef?.external_id || 'Unknown'} - ${tech.name}`;
          
          iocStrings.push(techName);
          eventsList.push({
            ioc: techName,
            type: "mitre_technique",
            mitreId: techExtRef?.external_id || "Unknown",
            timestamp: new Date().toISOString(),
            description: tech.description?.substring(0, 200) || "No description."
          });
        });

        eventsToCreate.push({
          eventName: `${apt.name} (MITRE ATT&CK)`,
          description: apt.description?.substring(0, 800) || "No description available.",
          isPublic: true,
          status: "Active",
          type: "APT Group",
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "MITRE_CORP", // System owned
          iocStrings: iocStrings,
          events: eventsList
        });
      }
    } catch (e) {
      console.error("Failed to fetch MITRE data:", e);
    }

    // 2. Fetch AlienVault OTX Pulses for "India"
    console.log("Fetching AlienVault OTX India Pulses...");
    try {
      const otxHeaders: any = {};
      if (process.env.ALIENVAULT_OTX_API_KEY && process.env.ALIENVAULT_OTX_API_KEY !== "your_alienvault_api_key_here") {
        otxHeaders['X-OTX-API-KEY'] = process.env.ALIENVAULT_OTX_API_KEY;
      }
      
      const otxRes = await fetch('https://otx.alienvault.com/api/v1/search/pulses?q=India&limit=3', { headers: otxHeaders });
      if (otxRes.ok) {
        const otxData = await otxRes.json();
        
        for (const pulse of otxData.results) {
          if (!pulse.indicators) continue;
          const iocs = pulse.indicators.slice(0, 5).map((ind: any) => ({
            ioc: ind.indicator,
            type: ind.type.toLowerCase().includes('ip') ? 'ip' : 
                  ind.type.toLowerCase().includes('hash') || ind.type.toLowerCase().includes('md5') ? 'hash' : 
                  ind.type.toLowerCase().includes('domain') || ind.type.toLowerCase().includes('url') ? 'domain' : 'other',
            timestamp: new Date().toISOString(),
            description: ind.description || `AlienVault Indicator from Pulse: ${pulse.name}`
          }));

          eventsToCreate.push({
            eventName: `${pulse.name} (AlienVault OTX)`,
            description: pulse.description?.substring(0, 500) || "No description available.",
            isPublic: true,
            status: "Active",
            type: "Regional Campaign",
            createdAt: new Date(pulse.created),
            updatedAt: new Date(),
            organizationId: "ALIENVAULT_OTX", // System owned
            iocStrings: iocs.map((i: any) => i.ioc),
            events: iocs
          });
        }
      } else {
        console.error("AlienVault API error:", await otxRes.text());
      }
    } catch (e) {
      console.error("Failed to fetch OTX data:", e);
    }

    // 3. Save to Firestore
    let savedCount = 0;
    const batch = db.batch();
    for (const event of eventsToCreate) {
      const docRef = db.collection('threatEvents').doc();
      batch.set(docRef, event);
      savedCount++;
    }
    
    await batch.commit();

    return NextResponse.json({ success: true, message: `Synced ${savedCount} global events.` });
  } catch (error: any) {
    console.error('Error syncing global data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
