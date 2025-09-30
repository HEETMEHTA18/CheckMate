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

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) { }
}

export async function readCerts(): Promise<CertRecord[]> {
  await ensureDataDir();
  try {
    const txt = await fs.readFile(CERT_PATH, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) {
    return [];
  }
}

export async function writeCerts(certificates: CertRecord[]) {
  await ensureDataDir();
  await fs.writeFile(CERT_PATH, JSON.stringify(certificates, null, 2), 'utf8');
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
