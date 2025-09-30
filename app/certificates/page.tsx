import { promises as fs } from "fs";
import path from "path";
import { readCerts } from "@/lib/cert-store";
import Link from "next/link";
import DeleteCertButton from '@/components/delete-cert-button';

export default async function CertificatesPage() {
  const certs = await readCerts();
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-[#e0e7ff] via-[#f0fdfa] to-[#fef9c3]">
      <div className="w-full max-w-4xl">
        <div className="bg-white/90 p-6 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Certificates</h2>
            <Link href="/" className="text-sm text-muted-foreground">← Back</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead>
                <tr className="bg-muted">
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Eligibility</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c: any) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2">{c.id}</td>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.eligibility ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">
                      {/* Client-only delete button */}
                      <DeleteCertButton id={c.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
