import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Build internal /api/verify URL based on request origin
    const incomingUrl = new URL(req.url);
    const verifyUrl = new URL('/api/verify', incomingUrl.origin);

    // Clone form data from incoming request
    const form = await req.formData();

    // Forward to internal verify endpoint and inject server-side key if present
    const headers: Record<string, string> = {};
    const serverKey = process.env.VERIFY_KEY;
    if (serverKey) headers['x-verify-key'] = serverKey;

    const forwardRes = await fetch(verifyUrl.toString(), {
      method: 'POST',
      body: form,
      headers,
    });

    const contentType = forwardRes.headers.get('content-type') || 'application/json';
    const body = await forwardRes.text();

    return new NextResponse(body, { status: forwardRes.status, headers: { 'content-type': contentType } });
  } catch (err: any) {
    console.error('verify-proxy error', err);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}
