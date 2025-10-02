"use client"

import type * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useState, useMemo } from "react"
// We'll dynamically import tesseract.js at runtime when needed to keep bundle small
import { VerificationReport } from "@/components/verification-report"
import { cn } from "@/lib/utils"

type VerificationResult = {
  authenticity: { pass: boolean; detail: string; score: number }
  eligibility: { pass: boolean; detail: string; score: number }
  mathLogic: { pass: boolean; detail: string; formula: string }
  truthTable: {
    A: 0 | 1 // Authenticity
    E: 0 | 1 // Eligibility  
    Y: 0 | 1 // Final Decision (Y = A ∧ E)
    table: Array<{ A: 0 | 1; E: 0 | 1; Y: 0 | 1 }>
  }
  finalDecision: "allowed" | "denied"
  normalizedNames: { input: string; extracted?: string }
  verificationDetails: {
    nameMatch: { exact: boolean; score: number; method: string }
    documentAnalysis: { 
      hasValidStructure: boolean
      containsExpectedFields: boolean
      suspiciousPatterns: string[]
    }
    eligibilityFactors: string[]
  }
  // Diagnostics added by backend for debugging extraction
  extractionSource?: string
  textSample?: string
  extracted?: Record<string, any>
  input?: Record<string, any>
  file?: Record<string, any>
}

export function CheckmateUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hashWarning, setHashWarning] = useState<string | null>(null)
  const [idWarning, setIdWarning] = useState<string | null>(null)

  // Real-time feedback: show possible matches as user types
  // Import validCertificates and normalizeName dynamically to avoid SSR issues
  const [matches, setMatches] = useState<string[]>([])
  useMemo(() => {
    if (!name.trim()) {
      setMatches([])
      return
    }
    // Dynamic import to avoid SSR issues
    import("@/lib/sample-db").then(({ validCertificates, normalizeName }) => {
      const normInput = normalizeName(name)
      // Subset match logic (same as backend)
      function isNameSubset(inputNorm: string, certNorm: string) {
        const inputTokens = new Set(inputNorm.split(" "));
        const certTokens = new Set(certNorm.split(" "));
        for (const t of inputTokens) {
          if (!certTokens.has(t)) return false;
        }
        return true;
      }
      const found = validCertificates
        .filter((c) => isNameSubset(normInput, c.name))
        .map((c) => c.name)
      setMatches(found)
    })
  }, [name])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
  setError(null)
  setResult(null)
  setHashWarning(null)
  setIdWarning(null)

    if (!file) {
      setError("Please select a certificate file (PDF or image).")
      return
    }
    if (!name.trim()) {
      setError("Please enter the student's full name.")
      return
    }

    try {
      setLoading(true)

      // If the user selected a file and it's an image or pdf, attempt client-side OCR
      // We'll dynamically import tesseract.js to avoid bundling it server-side.
      const lower = file.name.toLowerCase()
      const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.tiff') || lower.endsWith('.bmp')
      const isPdf = lower.endsWith('.pdf')

      // Default: upload file as before
      let res: Response

      if ((isImage || isPdf) && typeof window !== 'undefined') {
        try {
          const tesseract = await import('tesseract.js')
          // cast to any to avoid bundling TypeScript types for client-only dynamic import
          const createWorker: any = (tesseract as any).createWorker
          const worker: any = createWorker({ logger: (m: any) => { /* optional: progress */ } })
          await worker.load()
          await worker.loadLanguage('eng')
          await worker.initialize('eng')

          // For PDFs, we read as ArrayBuffer; for images, use blob URL
          let extractedText = ''
          if (isPdf) {
            const ab = await file.arrayBuffer()
            // Tesseract.js can't parse multi-page PDFs directly in browser reliably;
            // use a simple text extraction approach: attempt OCR on first page image fallback
            // Here we still attempt to run OCR over the raw PDF binary which may fail on some browsers.
            const blob = new Blob([ab], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const { data } = await worker.recognize(url)
            extractedText = data?.text || ''
            URL.revokeObjectURL(url)
          } else {
            const url = URL.createObjectURL(file)
            const { data } = await worker.recognize(url)
            extractedText = data?.text || ''
            URL.revokeObjectURL(url)
          }

          await worker.terminate()

          // Send extracted text to server (no secret exposure)
          res = await fetch('/api/verify-proxy', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name, extractedText, filename: file.name }),
          })
        } catch (ocrErr) {
          // OCR failed in browser; fallback to uploading original file
          const form = new FormData()
          form.append('file', file)
          form.append('name', name)
          res = await fetch('/api/verify-proxy', { method: 'POST', body: form })
        }
      } else {
        const form = new FormData()
        form.append('file', file)
        form.append('name', name)
        res = await fetch('/api/verify-proxy', { method: 'POST', body: form })
      }
      if (!res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const j = await res.json();
            throw new Error(j?.error || "Verification failed.")
          }
          const text = await res.text()
          throw new Error(text || "Verification failed.")
      }
      const data = (await res.json()) as VerificationResult
      setResult(data)
      // No hash or ID warnings in new logic-only mode
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function registerCert() {
    if (!result) return;
    const nameToRegister = (result.normalizedNames?.extracted as string) || name || result.extracted?.chosen || '';
    if (!nameToRegister) {
      setError('No name available to register');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: nameToRegister, eligibility: true }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed to register');
      setIdWarning(`Registered certificate ${j.cert?.id}`);
      // Refresh matches UI by triggering name state update
      setName(nameToRegister);
    } catch (e: any) {
      setError(e?.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify a Document</CardTitle>
        <div className="text-sm text-muted-foreground">Upload a certificate (PDF or image) and enter the owner's full name.</div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Student Full Name</Label>
          <Input
            id="name"
            placeholder="e.g., HEET HITESH MEHTA"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-background"
            required
            autoComplete="off"
          />
          {/* Real-time feedback: show possible matches */}
          {name.trim() && matches.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {matches.map((m) => (
                <div key={m} className="text-xs px-2 py-1 rounded-md bg-muted/20 text-muted-foreground">{m}</div>
              ))}
            </div>
          )}
          {name.trim() && matches.length === 0 && (
            <div className="flex items-center gap-3 mt-2">
              <div>
                <div className="text-sm text-destructive">No matching certificate found.</div>
                <div className="text-xs text-muted-foreground">Try different spacing/capitalization or try abbreviations (e.g., omit middle names).</div>
              </div>
              {result?.normalizedNames?.extracted ? (
                <Button size="sm" variant="secondary" onClick={registerCert} className="ml-2">Register extracted name</Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="file">Certificate File (PDF or Image)</Label>
          <Input
            id="file"
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="bg-background"
            required
          />
          <p className="text-xs text-muted-foreground">
            Tip: If your certificate has a known ID like {"CERT-XXXX-YYYYMMDD"}, include it in the file name for
            clarity.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button type="submit" disabled={loading} className={cn(loading && "opacity-70")}> 
            {loading ? "Verifying..." : "Verify Document"}
          </Button>
          {error ? <span className="text-destructive text-sm">{error}</span> : null}
          {hashWarning ? <span className="text-yellow-600 text-xs font-semibold">{hashWarning}</span> : null}
          {idWarning ? <span className="text-yellow-600 text-xs font-semibold">{idWarning}</span> : null}
        </div>
          </form>

          <Separator className="bg-border" />

          {result ? <VerificationReport result={result} inputName={name} /> : null}

          {/* Diagnostics box: show extraction source, text sample, extracted fields and raw JSON */}
          {result && (!result.authenticity?.pass || !result.eligibility?.pass) ? (
            <div className="mt-4 p-3 border rounded bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Extraction Source:</strong>{' '}
                  <span className="ml-1">{result.extractionSource ?? 'n/a'}</span>
                </div>
                <div>
                  <strong>Text Sample:</strong>{' '}
                  <span className="ml-1">{result.textSample ? result.textSample.slice(0, 120) : 'n/a'}</span>
                </div>
              </div>

              <div className="mt-2">
                <strong>Extracted:</strong>{' '}
                <span className="ml-1">{result.normalizedNames?.extracted ?? (result.extracted ? JSON.stringify(result.extracted) : '(none)')}</span>
              </div>

              <div className="mt-3">
                <strong>Full API response</strong>
                <pre className="mt-2 overflow-auto text-xs" style={{ maxHeight: 320 }}>
{JSON.stringify(result, null, 2)}
                </pre>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={registerCert}>Register certificate</Button>
                <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(result)); }}>
                  Copy JSON
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
