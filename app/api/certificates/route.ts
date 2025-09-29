import { NextResponse } from 'next/server';
import { readCerts, addCert } from '@/lib/cert-store';
import { normalizeName } from '@/lib/sample-db';

export async function GET() {
  const certs = await readCerts();
  return NextResponse.json({ certificates: certs });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const id = body.id || `CERT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const cert = { id, name: normalizeName(body.name), eligibility: !!body.eligibility, hash: body.hash || null };
    await addCert(cert as any);
    return NextResponse.json({ ok: true, cert });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'invalid' }, { status: 400 });
  }
}
