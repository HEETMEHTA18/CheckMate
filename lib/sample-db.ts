export type Certificate = {
  id: string
  name: string // canonical, uppercase, token-sorted
  hash: string | null // known original file SHA-256, if any
  eligibility: boolean
}

// Helper to normalize a name: uppercase, tokenize, sort, join with single space
export function normalizeName(raw: string) {
  return raw.trim().replace(/\s+/g, " ").toUpperCase().split(" ").filter(Boolean).sort().join(" ")
}

// Seed data (add or adjust as needed)
export const validCertificates: Certificate[] = [
  {
    id: "CERT-HHM-20250928",
    name: normalizeName("HEET HITESH MEHTA"),
    hash: null, // set a known SHA-256 string here if available
    eligibility: true,
  },
  {
    id: "CERT-ABC-20240101",
    name: normalizeName("ALICE BOB"),
    hash: null,
    eligibility: false,
  },
]
