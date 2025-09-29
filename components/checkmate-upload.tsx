"use client"

import type * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useState, useMemo } from "react"
import { VerificationReport } from "@/components/verification-report"
import { cn } from "@/lib/utils"

type VerificationResult = {
  ownerStatus: { pass: boolean; detail: string }
  mathLogic: { pass: boolean; detail: string }
  truthTable: {
    A: 0 | 1
    Y: 0 | 1
    table: Array<{ A: 0 | 1; Y: 0 | 1 }>
  }
  finalDecision: "allowed" | "denied"
  normalizedNames: { input: string; extracted?: string }
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
      const form = new FormData()
      form.append("file", file)
      form.append("name", name)

      const res = await fetch("/api/verify-proxy", {
        method: "POST",
        body: form,
      })
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

  return (
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
            <div className="text-xs text-muted-foreground mt-1">
              Possible match{matches.length > 1 ? "es" : ""}: {matches.join(", ")}
            </div>
          )}
          {name.trim() && matches.length === 0 && (
            <div className="text-xs text-destructive mt-1">No matching certificate found for this name.</div>
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
      {result ? (
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
        </div>
      ) : null}
    </div>
  )
}
