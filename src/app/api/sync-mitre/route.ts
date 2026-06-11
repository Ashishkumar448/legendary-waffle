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
    oldEventsSnap.docs.forEach((doc: any) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();

    // 1. Inject Lightweight MITRE Data (Bypassing 40MB STIX JSON memory crash)
    console.log("Injecting Lightweight MITRE CTI Data...");
    
    const mitreApts = [
      { id: "G0016", name: "APT29", desc: "Russian government threat group.", url: "https://attack.mitre.org/groups/G0016", techs: [{ id: "T1566", name: "Phishing" }, { id: "T1059", name: "Command and Scripting Interpreter" }] },
      { id: "G0007", name: "APT28", desc: "Fancy Bear, Russian military intelligence.", url: "https://attack.mitre.org/groups/G0007", techs: [{ id: "T1110", name: "Brute Force" }, { id: "T1105", name: "Ingress Tool Transfer" }] },
      { id: "G0022", name: "APT3", desc: "China-based threat group.", url: "https://attack.mitre.org/groups/G0022", techs: [{ id: "T1078", name: "Valid Accounts" }, { id: "T1003", name: "OS Credential Dumping" }] },
      { id: "G0032", name: "Lazarus Group", desc: "North Korean state-sponsored cyber group.", url: "https://attack.mitre.org/groups/G0032", techs: [{ id: "T1486", name: "Data Encrypted for Impact" }, { id: "T1055", name: "Process Injection" }] },
      { id: "G0087", name: "FIN7", desc: "Financially motivated threat group.", url: "https://attack.mitre.org/groups/G0087", techs: [{ id: "T1185", name: "Browser Session Hijacking" }, { id: "T1566", name: "Phishing" }] },
      { id: "G0130", name: "Sandworm Team", desc: "Russian GRU cyber warfare unit.", url: "https://attack.mitre.org/groups/G0130", techs: [{ id: "T1485", name: "Data Destruction" }, { id: "T1071", name: "Application Layer Protocol" }] },
      { id: "G0006", name: "APT1", desc: "Chinese PLA Unit 61398.", url: "https://attack.mitre.org/groups/G0006", techs: [{ id: "T1056", name: "Input Capture" }, { id: "T1040", name: "Network Sniffing" }] },
      { id: "G0050", name: "APT32", desc: "OceanLotus, Vietnam-aligned group.", url: "https://attack.mitre.org/groups/G0050", techs: [{ id: "T1027", name: "Obfuscated Files or Information" }, { id: "T1140", name: "Deobfuscate/Decode Files or Information" }] },
      { id: "G0034", name: "Sandworm Team", desc: "Destructive malware campaigns.", url: "https://attack.mitre.org/groups/G0034", techs: [{ id: "T1053", name: "Scheduled Task/Job" }, { id: "T1021", name: "Remote Services" }] },
      { id: "G0096", name: "APT41", desc: "Chinese state-sponsored espionage group.", url: "https://attack.mitre.org/groups/G0096", techs: [{ id: "T1190", name: "Exploit Public-Facing Application" }, { id: "T1055", name: "Process Injection" }] },
      { id: "G0114", name: "Mustang Panda", desc: "China-based cyber espionage group.", url: "https://attack.mitre.org/groups/G0114", techs: [{ id: "T1036", name: "Masquerading" }, { id: "T1204", name: "User Execution" }] },
      { id: "G0099", name: "Turla", desc: "Russian FSB affiliated group.", url: "https://attack.mitre.org/groups/G0099", techs: [{ id: "T1090", name: "Proxy" }, { id: "T1132", name: "Data Encoding" }] },
      { id: "G0125", name: "HAFNIUM", desc: "Threat actors operating out of China.", url: "https://attack.mitre.org/groups/G0125", techs: [{ id: "T1505", name: "Server Software Component" }, { id: "T1136", name: "Create Account" }] },
      { id: "G0018", name: "Admin@338", desc: "Cyber threat group operating out of China.", url: "https://attack.mitre.org/groups/G0018", techs: [{ id: "T1003", name: "OS Credential Dumping" }, { id: "T1083", name: "File and Directory Discovery" }] },
      { id: "G0045", name: "menuPass", desc: "APT10, Chinese cyber espionage group.", url: "https://attack.mitre.org/groups/G0045", techs: [{ id: "T1078", name: "Valid Accounts" }, { id: "T1105", name: "Ingress Tool Transfer" }] }
    ];

    for (const apt of mitreApts) {
      const iocStrings = [apt.url];
      const eventsList = [
        {
          ioc: apt.url,
          type: "url",
          mitreId: apt.id,
          timestamp: new Date().toISOString(),
          description: "MITRE ATT&CK Group Reference"
        }
      ];

      apt.techs.forEach(tech => {
        const techName = `${tech.id} - ${tech.name}`;
        iocStrings.push(techName);
        eventsList.push({
          ioc: techName,
          type: "mitre_technique",
          mitreId: tech.id,
          timestamp: new Date().toISOString(),
          description: "Known technique utilized by this threat group."
        });
      });

      eventsToCreate.push({
        eventName: `${apt.name} (MITRE ATT&CK)`,
        description: apt.desc,
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
