import { NextResponse } from "next/server";
import axios from "axios";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Threat Intel Service logic
class ThreatIntelService {
  static async enrichVirusTotal(ioc: string, type: string) {
    try {
      const apiKey = process.env.VIRUSTOTAL_API_KEY;
      if (!apiKey) return { error: 'VirusTotal API key not configured' };

      let endpoint;
      switch (type) {
        case 'hash':
          endpoint = `https://www.virustotal.com/api/v3/files/${ioc}`;
          break;
        case 'ip':
          endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${ioc}`;
          break;
        case 'domain':
          endpoint = `https://www.virustotal.com/api/v3/domains/${ioc}`;
          break;
        case 'url':
          const urlId = Buffer.from(ioc).toString('base64').replace(/=/g, '');
          endpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;
          break;
        default:
          return { error: 'Unsupported IOC type for VirusTotal' };
      }

      const response = await axios.get(endpoint, {
        headers: { 'x-apikey': apiKey },
        timeout: 10000
      });

      return {
        source: 'VirusTotal',
        data: response.data.data.attributes,
        reputation: response.data.data.attributes.last_analysis_stats
      };
    } catch (error: any) {
      return { error: error.response?.data?.error?.message || error.message };
    }
  }

  static async enrichURLhaus(ioc: string, type: string) {
    try {
      if (type !== 'url' && type !== 'domain' && type !== 'hash') {
        return { error: 'URLhaus only supports URLs, domains, and hashes' };
      }

      const response = await axios.post('https://urlhaus-api.abuse.ch/v1/payload/', 
        new URLSearchParams({ [type === 'hash' ? 'sha256_hash' : type]: ioc }),
        { timeout: 10000 }
      );

      return { source: 'URLhaus', data: response.data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async enrichMalwareBazaar(hash: string) {
    try {
      const response = await axios.post('https://mb-api.abuse.ch/api/v1/', {
        query: 'get_info',
        hash: hash
      }, { timeout: 10000 });

      return { source: 'MalwareBazaar', data: response.data.data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async enrichAlienVaultOTX(ioc: string, type: string) {
    try {
      const apiKey = process.env.ALIENVAULT_OTX_API_KEY;
      if (!apiKey) return { error: 'AlienVault OTX API key not configured' };

      let indicatorType = '';
      if (type === 'ip') indicatorType = 'IPv4';
      else if (type === 'domain') indicatorType = 'domain';
      else if (type === 'hash') indicatorType = 'file'; // OTX accepts hashes as 'file'
      else if (type === 'url') indicatorType = 'url';
      else return { error: 'Unsupported IOC type for AlienVault' };

      const response = await axios.get(`https://otx.alienvault.com/api/v1/indicators/${indicatorType}/${ioc}/general`, {
        headers: { 'X-OTX-API-KEY': apiKey },
        timeout: 10000
      });

      return { source: 'AlienVault OTX', data: response.data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async enrichAbuseIPDB(ip: string) {
    try {
      const apiKey = process.env.ABUSEIPDB_API_KEY;
      if (!apiKey) return { error: 'AbuseIPDB API key not configured' };

      const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
        params: { ipAddress: ip, maxAgeInDays: 90 },
        headers: { 'Key': apiKey, 'Accept': 'application/json' },
        timeout: 10000
      });

      return { source: 'AbuseIPDB', data: response.data.data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  static async enrichIOC(ioc: string, type: string) {
    const results = [];
    switch (type) {
      case 'hash':
        results.push(await this.enrichVirusTotal(ioc, 'hash'));
        results.push(await this.enrichMalwareBazaar(ioc));
        results.push(await this.enrichAlienVaultOTX(ioc, 'hash'));
        break;
      case 'ip':
        results.push(await this.enrichVirusTotal(ioc, 'ip'));
        results.push(await this.enrichAbuseIPDB(ioc));
        results.push(await this.enrichAlienVaultOTX(ioc, 'ip'));
        break;
      case 'domain':
        results.push(await this.enrichVirusTotal(ioc, 'domain'));
        results.push(await this.enrichURLhaus(ioc, 'domain'));
        results.push(await this.enrichAlienVaultOTX(ioc, 'domain'));
        break;
      case 'url':
        results.push(await this.enrichVirusTotal(ioc, 'url'));
        results.push(await this.enrichURLhaus(ioc, 'url'));
        results.push(await this.enrichAlienVaultOTX(ioc, 'url'));
        break;
      case 'email':
        results.push({ error: 'Email enrichment temporarily disabled (Requires an alternative OSINT source)' });
        break;
      default:
        return [{ error: 'Unsupported IOC type' }];
    }
    return results.filter(result => result && !result.error);
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    const body = await req.json();
    const { ioc, type } = body;

    if (!ioc || !type) {
      return NextResponse.json({ error: "Missing ioc or type" }, { status: 400 });
    }

    // Call enrichment logic
    const results = await ThreatIntelService.enrichIOC(ioc, type);

    // Save search history in Firestore for the user
    await adminDb.collection("users").doc(decodedToken.uid).collection("history").add({
      ioc,
      type,
      timestamp: new Date().toISOString(),
      resultsSummary: results.map(r => r.source),
    });

    // Save to global IOC graph if there are results
    if (results.length > 0) {
      await adminDb.collection("global_iocs").doc(Buffer.from(ioc).toString('base64')).set({
        ioc,
        type,
        lastEnriched: new Date().toISOString(),
        sources: results.map(r => r.source)
      }, { merge: true });
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error("Enrichment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
