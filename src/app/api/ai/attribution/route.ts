import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { campaignName, iocs } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured in .env" }, { status: 400 });
    }

    const prompt = `
You are an expert Threat Intelligence Attribution Engine.
Analyze the following Campaign and its IOCs/MITRE tags. Match the behavioral patterns against known Advanced Persistent Threats (APTs) or threat actors.
Return EXACTLY a JSON array of the top 2 matching actors, with a confidence score (0-100) and a 1-sentence evidence string.
Example format:
[
  { "actor": "Lazarus Group", "confidence": 68, "evidence": "Heavy use of T1059 and matching naming conventions." },
  { "actor": "APT29", "confidence": 41, "evidence": "Some overlap in C2 infrastructure patterns." }
]
DO NOT output any markdown formatting or backticks around the JSON. ONLY output the raw JSON array.

Campaign Name: ${campaignName}
IOCs:
${(iocs || []).map((i: any) => `- ${i.ioc} (${i.type}) - MITRE: ${(i.mitreTags || []).join(', ')}`).join('\n')}
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let rawJson = data.choices[0].message.content.trim();
    if (rawJson.startsWith('\`\`\`json')) {
      rawJson = rawJson.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    if (rawJson.startsWith('\`\`\`')) {
      rawJson = rawJson.replace(/\`\`\`/g, '').trim();
    }
    
    return NextResponse.json({ attribution: JSON.parse(rawJson) });
  } catch (error: any) {
    console.error("AI Attribution Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate attribution" }, { status: 500 });
  }
}
