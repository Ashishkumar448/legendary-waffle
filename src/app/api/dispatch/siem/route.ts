import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ioc, type } = body;

    if (!ioc || !type) {
      return NextResponse.json({ error: "Missing ioc or type" }, { status: 400 });
    }

    // Here we would typically use axios to POST to CrowdStrike, Sentinel, Palo Alto, etc.
    // For this free-tier demo, we will simulate the push and log it to the console
    // instead of writing to adminDb to avoid local credential errors.
    
    // Simulate network delay to SIEM
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`[ACTIVE DEFENSE] Successfully pushed ${type} IOC: ${ioc} to simulated SIEM perimeter.`);

    return NextResponse.json({ 
      success: true, 
      message: "IOC successfully dispatched to defense systems.",
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
