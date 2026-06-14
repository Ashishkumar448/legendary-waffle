import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ioc = url.searchParams.get('ioc');
    const type = url.searchParams.get('type');
    
    if (!ioc || !type) return NextResponse.json({ error: "Missing ioc or type" }, { status: 400 });
    
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing VT API key" }, { status: 500 });

    let endpoint = "";
    if (type === 'ip') endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${ioc}/resolutions?limit=15`;
    else if (type === 'domain') endpoint = `https://www.virustotal.com/api/v3/domains/${ioc}/resolutions?limit=15`;
    else if (type === 'hash') endpoint = `https://www.virustotal.com/api/v3/files/${ioc}/contacted_ips?limit=15`;
    else return NextResponse.json({ results: [] });

    const res = await axios.get(endpoint, {
      headers: { 'x-apikey': apiKey },
      timeout: 10000
    });

    const results = res.data.data.map((item: any) => {
      if (type === 'ip') return { id: item.attributes.host_name, type: 'domain' };
      if (type === 'domain') return { id: item.attributes.ip_address, type: 'ip' };
      if (type === 'hash') return { id: item.id, type: 'ip' };
      return null;
    }).filter(Boolean);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Pivot error", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to pivot", details: error.response?.data }, { status: 500 });
  }
}
