import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { campaignName, description, iocs } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured in .env" }, { status: 400 });
    }

    const prompt = `
You are a Senior Cyber Threat Intelligence Analyst. 
I will provide you with a Threat Campaign name, its description, and a list of Indicators of Compromise (IOCs) with their associated MITRE ATT&CK tags and types.
Your task is to write a highly professional, 3-paragraph executive threat narrative.
Paragraph 1: Executive Summary (What is this campaign, potential motive, targeted industry heuristics).
Paragraph 2: Technical Analysis (Summarize the infrastructure, e.g., "The actor utilizes X domains and Y IPs, exhibiting techniques such as Z").
Paragraph 3: Recommendations (Defensive next steps).

DO NOT output any markdown headers, just the 3 paragraphs separated by double newlines. Make it sound extremely professional, as if written by Mandiant or CrowdStrike.

Campaign Name: ${campaignName}
Description: ${description || 'No description provided.'}
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
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return NextResponse.json({ report: data.choices[0].message.content.trim() });
  } catch (error: any) {
    console.error("AI Report Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
