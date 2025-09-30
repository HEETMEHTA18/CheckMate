import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Build internal /api/verify URL based on request origin
    const incomingUrl = new URL(req.url);
    const verifyUrl = new URL('/api/verify', incomingUrl.origin);
    // Determine content type and forward accordingly
      const incomingContentType = req.headers.get('content-type') || '';
    const headers: Record<string, string> = {};
    const serverKey = process.env.VERIFY_KEY;
    if (serverKey) headers['x-verify-key'] = serverKey;

    let forwardRes: Response
      if (incomingContentType.includes('application/json')) {
      // Forward JSON body as-is
      const json = await req.json();
      forwardRes = await fetch(verifyUrl.toString(), {
        method: 'POST',
        body: JSON.stringify(json),
        headers: { 'content-type': 'application/json', ...headers },
      })
    } else {
      // Assume multipart/form-data
      const form = await req.formData();
      forwardRes = await fetch(verifyUrl.toString(), {
        method: 'POST',
        body: form,
        headers,
      })
    }

    const contentType = forwardRes.headers.get('content-type') || 'application/json';
    const body = await forwardRes.text();

    return new NextResponse(body, { status: forwardRes.status, headers: { 'content-type': contentType } });
  } catch (err: any) {
    console.error('verify-proxy error', err);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}
