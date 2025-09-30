import { promises as fs } from 'fs';
import path from 'path';

export type CertRecord = {
  id: string;
  name: string;
  eligibility?: boolean;
  hash?: string | null;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CERT_PATH = path.join(DATA_DIR, 'certificates.json');

// In some serverless hosts (Vercel, Cloud Functions) the filesystem may be
// read-only or ephemeral. To avoid runtime crashes (ENOENT) when reading or
// writing `data/certificates.json`, we attempt to use the disk but fall back
// to an in-memory store if the directory is not writable or creation fails.
let useMemoryStore = false;
let inMemoryStore: CertRecord[] | null = null;

async function ensureDataDir() {
  if (useMemoryStore) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err: any) {
    // If creating the directory fails (permission denied, read-only FS),
    // fall back to in-memory store for the lifetime of the running instance.
    console.warn('cert-store: cannot create data directory, falling back to memory store:', err?.message || err);
    useMemoryStore = true;
    inMemoryStore = inMemoryStore || [];
  }
}

export async function readCerts(): Promise<CertRecord[]> {
  if (inMemoryStore) return inMemoryStore;
  await ensureDataDir();
  if (useMemoryStore) return (inMemoryStore = inMemoryStore || []);
  try {
    const txt = await fs.readFile(CERT_PATH, 'utf8');
    const parsed = JSON.parse(txt || '[]');
    inMemoryStore = parsed;
    return parsed;
  } catch (err: any) {
    // If file is missing, return empty array and keep an in-memory copy so
    // subsequent writes use the fallback if required.
    if (err?.code === 'ENOENT') {
      inMemoryStore = [];
      return [];
    }
    console.warn('cert-store: error reading certificates file, using memory fallback:', err?.message || err);
    inMemoryStore = [];
    useMemoryStore = true;
    return [];
  }
}

export async function writeCerts(certificates: CertRecord[]) {
  if (useMemoryStore) {
    inMemoryStore = certificates;
    // Do not throw — persist in-memory for the current instance only.
    console.warn('cert-store: write skipped, using in-memory store (read-only filesystem)');
    return;
  }
  await ensureDataDir();
  try {
    await fs.writeFile(CERT_PATH, JSON.stringify(certificates, null, 2), 'utf8');
    inMemoryStore = certificates;
  } catch (err: any) {
    console.warn('cert-store: failed to write to disk, switching to in-memory store:', err?.message || err);
    useMemoryStore = true;
    inMemoryStore = certificates;
  }
}

export async function addCert(cert: CertRecord) {
  const cur = await readCerts();
  cur.push(cert);
  await writeCerts(cur);
  return cert;
}

export async function findCertById(id: string) {
  const cur = await readCerts();
  return cur.find(c => c.id === id) || null;
}

export async function removeCert(id: string) {
  const cur = await readCerts();
  const next = cur.filter(c => c.id !== id);
  await writeCerts(next);
  return next;
}

export default { readCerts, writeCerts, addCert, findCertById };
