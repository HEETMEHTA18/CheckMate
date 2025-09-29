import { normalizeName } from "./sample-db"

export type VerifyInput = {
  name: string // user input name
  extractedName?: string // name extracted from document (OCR)
  file?: { bytes: ArrayBuffer; filename?: string } | null
}

export type VerifyOutput = {
  ownerStatus: { pass: boolean; detail: string }
  mathLogic: { pass: boolean; detail: string }
  truthTable: {
    A: 0 | 1
    Y: 0 | 1
    table: Array<{ A: 0 | 1; Y: 0 | 1 }>
  }
  finalDecision: "allowed" | "denied"
  normalizedNames: { input: string; extracted?: string }
}

function toHex(ab: ArrayBuffer) {
  const bytes = new Uint8Array(ab)
  let hex = ""
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0")
  }
  return hex
}

async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string | undefined> {
  try {
    const uint8: Uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer)
    if (globalThis.crypto?.subtle) {
      // Cast to BufferSource (Uint8Array is a valid BufferSource)
      const digest = await globalThis.crypto.subtle.digest("SHA-256", uint8 as BufferSource)
      return toHex(digest)
    }
  } catch {
    // fall through to Node fallback
  }
  try {
    // dynamic import to avoid bundling errors if Node crypto is unavailable
    const { createHash } = await import("crypto")
    const hash = createHash("sha256")
    // Node createHash accepts Uint8Array directly
    hash.update(data instanceof Uint8Array ? data : new Uint8Array(data))
    return hash.digest("hex")
  } catch {
    // hashing not available in this environment; treat as optional
    return undefined
  }
}

function extractCertIdFromFilename(filename?: string | null): string | null {
  if (!filename) return null
  const upper = filename.toUpperCase()
  const m = upper.match(/CERT-[A-Z0-9]+-\d{8}/)
  return m ? m[0] : null
}

export async function verifyDocument(input: VerifyInput): Promise<VerifyOutput> {
  // Normalize both names
  const normInput = normalizeName(input.name || "")
  const normExtracted = normalizeName(input.extractedName || "")

  // Flexible match: at least 2 tokens overlap or 60% of input tokens present in extracted name
  function tokenOverlapFraction(a: string, b: string) {
    const aTokens = a.split(" ").filter(Boolean)
    const bTokens = b.split(" ").filter(Boolean)
    if (aTokens.length === 0) return 0
    const overlap = aTokens.filter(t => bTokens.includes(t))
    return overlap.length / aTokens.length
  }

  function tokensOverlapCount(a: string, b: string) {
    const aTokens = a.split(" ").filter(Boolean)
    const bTokens = b.split(" ").filter(Boolean)
    return aTokens.filter(t => bTokens.includes(t)).length
  }

  // Proposition A: input name is sufficiently found in extracted name (flexible set membership)
  const A_bool = (() => {
    const count = tokensOverlapCount(normInput, normExtracted)
    if (count >= 2) return true
    if (normInput.split(" ").filter(Boolean).length > 0 && tokenOverlapFraction(normInput, normExtracted) >= 0.6) return true
    return false
  })()

  // Proposition B: certificate id present (from filename or extractedName). Heuristic: look for CERT-... pattern
  function extractCertId(s?: string | null | undefined) {
    if (!s) return null
    const m = s.toUpperCase().match(/CERT-[A-Z0-9\-]+/)
    return m ? m[0] : null
  }

  const certIdFromFilename = extractCertId(input.file?.filename as any ?? null)
  const certIdFromText = extractCertId(input.extractedName ?? null) || extractCertId((input.extractedName || "") as any)
  const B_bool = !!(certIdFromFilename || certIdFromText)

  // Proposition C: partial evidence - some token overlap (>=1 token) between input and extracted
  const C_bool = tokensOverlapCount(normInput, normExtracted) >= 1

  // Compose final logic: Y = A OR (B AND C)
  const Y_bool = A_bool || (B_bool && C_bool)

  const ownerStatus = {
    pass: A_bool,
    detail: `A (name ∈ doc) = ${A_bool} (${tokensOverlapCount(normInput, normExtracted)} token overlap)`,
  }

  const mathLogic = {
    pass: Y_bool,
    detail: `Y = A OR (B AND C) => ${Y_bool} (A=${A_bool}, B=${B_bool}, C=${C_bool})`,
  }

  const truthTable = {
    A: A_bool ? (1 as 1) : (0 as 0),
    Y: Y_bool ? (1 as 1) : (0 as 0),
    table: [
      // show canonical rows for A (and illustrative B/C combinations)
      { A: 0 as 0, Y: (A_bool ? (1 as 1) : (0 as 0)) },
      { A: 1 as 1, Y: (A_bool ? (1 as 1) : (0 as 0)) },
    ] as Array<{ A: 0 | 1; Y: 0 | 1 }>,
  }

  return {
    ownerStatus,
    mathLogic,
    truthTable,
    finalDecision: Y_bool ? "allowed" : "denied",
    normalizedNames: { input: normInput, extracted: normExtracted },
  }
}
