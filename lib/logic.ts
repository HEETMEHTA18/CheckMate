import { normalizeName } from "./sample-db"

export type VerifyInput = {
  name: string // user input name
  extractedName?: string // name extracted from document (OCR)
  file?: { bytes: ArrayBuffer; filename?: string } | null
  extractedText?: string // full extracted text for analysis
}

export type VerifyOutput = {
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
  const extractedText = input.extractedText || ""

  // Enhanced name comparison that handles names in any order
  function compareNamesFlexible(inputName: string, extractedName: string): { 
    exactMatch: boolean, 
    tokenOverlap: number, 
    overlapFraction: number,
    fuzzyMatch: boolean,
    score: number,
    method: string
  } {
    const inputTokens = inputName.split(" ").filter(Boolean)
    const extractedTokens = extractedName.split(" ").filter(Boolean)
    
    if (inputTokens.length === 0 || extractedTokens.length === 0) {
      return { exactMatch: false, tokenOverlap: 0, overlapFraction: 0, fuzzyMatch: false, score: 0, method: 'no-tokens' }
    }

    // Check for exact match (order independent)
    const inputSet = new Set(inputTokens.map(t => t.toUpperCase()))
    const extractedSet = new Set(extractedTokens.map(t => t.toUpperCase()))
    const exactMatch = inputSet.size === extractedSet.size && 
                      [...inputSet].every(token => extractedSet.has(token))

    // Count exact token overlaps (order independent)
    let exactOverlap = 0
    for (const token of inputTokens) {
      if (extractedTokens.some(et => et.toUpperCase() === token.toUpperCase())) {
        exactOverlap++
      }
    }

    // Fuzzy matching with Levenshtein distance for typos/OCR errors
    let fuzzyOverlap = 0
    const usedExtractedIndices = new Set<number>()
    
    for (const inputToken of inputTokens) {
      let bestMatch = { index: -1, distance: Infinity }
      
      extractedTokens.forEach((extractedToken, index) => {
        if (usedExtractedIndices.has(index)) return
        
        const distance = levenshteinDistance(inputToken.toUpperCase(), extractedToken.toUpperCase())
        const maxAllowedDistance = Math.max(1, Math.floor(Math.min(inputToken.length, extractedToken.length) * 0.3))
        
        if (distance <= maxAllowedDistance && distance < bestMatch.distance) {
          bestMatch = { index, distance }
        }
      })
      
      if (bestMatch.index !== -1) {
        usedExtractedIndices.add(bestMatch.index)
        fuzzyOverlap++
      }
    }

    const overlapFraction = exactOverlap / inputTokens.length
    const fuzzyFraction = fuzzyOverlap / inputTokens.length
    const fuzzyMatch = fuzzyFraction >= 0.6

    // Calculate comprehensive score (0-100)
    let score = 0
    let method = 'partial'
    
    if (exactMatch) {
      score = 100
      method = 'exact-match'
    } else {
      score += exactOverlap * 25 // Each exact token match = 25 points
      score += (fuzzyOverlap - exactOverlap) * 15 // Each fuzzy match = 15 points
      score += overlapFraction * 35 // Fraction bonus
      if (inputTokens.length >= 2 && exactOverlap >= 2) {
        score += 25 // Multi-token bonus
        method = 'multi-token'
      } else if (fuzzyMatch) {
        method = 'fuzzy-match'
      }
    }

    return {
      exactMatch,
      tokenOverlap: exactOverlap,
      overlapFraction,
      fuzzyMatch,
      score: Math.min(100, score),
      method
    }
  }

  // Helper function for Levenshtein distance
  function levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))

    for (let i = 0; i <= a.length; i += 1) {
      matrix[0][i] = i
    }
    for (let j = 0; j <= b.length; j += 1) {
      matrix[j][0] = j
    }
    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }
    return matrix[b.length][a.length]
  }

  // Document Analysis Functions
  function analyzeDocumentStructure(text: string): { hasValidStructure: boolean; containsExpectedFields: boolean; suspiciousPatterns: string[] } {
    const upperText = text.toUpperCase()
    const suspiciousPatterns: string[] = []
    
    // Check for valid certificate structure
    const validIndicators = [
      'CERTIFICATE', 'CERTIFY', 'AWARDED', 'PRESENTED', 'SCHOLARSHIP',
      'ACHIEVEMENT', 'COMPLETION', 'GRADUATION', 'DEGREE', 'DIPLOMA'
    ]
    const hasValidStructure = validIndicators.some(indicator => upperText.includes(indicator))
    
    // Check for expected fields
    const expectedFields = ['NAME', 'DATE', 'SIGNATURE', 'SEAL']
    const containsExpectedFields = expectedFields.filter(field => upperText.includes(field)).length >= 2
    
    // Detect suspicious patterns
    if (text.length < 50) suspiciousPatterns.push('Document too short')
    if (!/[0-9]/.test(text)) suspiciousPatterns.push('No dates or numbers found')
    if (text.split('\n').length < 3) suspiciousPatterns.push('Insufficient line breaks')
    
    // Check for obvious forgery indicators
    const forgeryIndicators = ['FAKE', 'COPY', 'SAMPLE', 'TEMPLATE', 'DRAFT']
    forgeryIndicators.forEach(indicator => {
      if (upperText.includes(indicator)) suspiciousPatterns.push(`Contains "${indicator}"`)
    })
    
    return { hasValidStructure, containsExpectedFields, suspiciousPatterns }
  }

  function assessEligibility(inputName: string, extractedText: string, extractedName?: string): { factors: string[]; score: number } {
    const factors: string[] = []
    let score = 30 // Lower base score - must earn eligibility
    
    const upperText = extractedText.toUpperCase()
    const inputUpper = inputName.toUpperCase()
    const extractedUpper = (extractedName || '').toUpperCase()
    
    // First priority: Check if we have a reliable extracted name (from OCR)
    let nameFoundInText = false
    
    if (extractedName && extractedUpper.length > 0) {
      // Use the same comparison logic as the main verification to ensure consistency
      const nameComparison = compareNamesFlexible(inputName, extractedName)
      
      if (nameComparison.exactMatch && nameComparison.score >= 95) {
        factors.push('Perfect name match via OCR extraction')
        score += 50 // Major boost for perfect OCR match
        nameFoundInText = true
      } else if (nameComparison.score >= 85) {
        factors.push(`Strong name match via OCR: ${nameComparison.score}% similarity`)
        score += 35
        nameFoundInText = true
      } else if (nameComparison.score >= 70) {
        factors.push(`Partial name match via OCR: ${nameComparison.score}% similarity`)
        score += 20
        nameFoundInText = true
      } else if (nameComparison.score >= 50) {
        factors.push(`Weak name match via OCR: ${nameComparison.score}% similarity`)
        score += 10
        nameFoundInText = true
      } else {
        // Names are too different - this is likely a mismatch
        factors.push(`Name mismatch: Input "${inputName}" vs Document "${extractedName}" (${nameComparison.score}% similarity)`)
        score = Math.max(0, score - 40) // Heavy penalty for name mismatch
      }
    }
    
    // Second priority: Check if name appears in full document text (only if OCR didn't find a match)
    if (!nameFoundInText && extractedText.length > 0) {
      const nameTokens = inputUpper.split(' ').filter(Boolean)
      
      if (upperText.includes(inputUpper)) {
        factors.push('Full name found in document text')
        score += 40 // Major boost for full name match
        nameFoundInText = true
      } else {
        // Check for partial name matches in document text
        const foundTokens = nameTokens.filter(token => 
          token.length >= 3 && upperText.includes(token) // Avoid matching short tokens like "A", "OF"
        )
        if (foundTokens.length >= Math.ceil(nameTokens.length * 0.7)) { // Require majority of tokens
          factors.push(`Partial name match in text: ${foundTokens.length}/${nameTokens.length} tokens found`)
          score += 25
          nameFoundInText = true
        } else if (foundTokens.length >= 2) {
          factors.push(`Some name tokens in text: ${foundTokens.length}/${nameTokens.length} tokens found`)
          score += 10
          nameFoundInText = true
        } else if (foundTokens.length === 1 && nameTokens.length === 1) {
          factors.push('Single name token found in document')
          score += 15
          nameFoundInText = true
        } else if (foundTokens.length === 1) {
          factors.push('One name token found in document')
          score += 5 // Very small boost for single token
        }
      }
    }
    
    // Penalize if we have neither OCR match nor text match
    if (!nameFoundInText) {
      factors.push('No name tokens found in document - potential mismatch')
      score = Math.max(0, score - 25) // Significant penalty for no name match
    }
    
    // Look for academic indicators
    const academicTerms = ['STUDENT', 'ACADEMIC', 'EDUCATION', 'UNIVERSITY', 'COLLEGE', 'SCHOOL']
    academicTerms.forEach(term => {
      if (upperText.includes(term)) {
        factors.push(`Academic context: ${term}`)
        score += 5
      }
    })
    
    // Look for achievement indicators
    const achievementTerms = ['ACHIEVEMENT', 'EXCELLENCE', 'OUTSTANDING', 'MERIT', 'DISTINCTION']
    achievementTerms.forEach(term => {
      if (upperText.includes(term)) {
        factors.push(`Achievement indicator: ${term}`)
        score += 10
      }
    })
    
    // Check for valid date patterns
    const datePattern = /\b(19|20)\d{2}\b/
    if (datePattern.test(extractedText)) {
      factors.push('Valid date format found')
      score += 15
    }
    
    // Check for signature/authority indicators
    const authorityTerms = ['PRINCIPAL', 'DIRECTOR', 'DEAN', 'REGISTRAR', 'SIGNATURE', 'SEAL']
    authorityTerms.forEach(term => {
      if (upperText.includes(term)) {
        factors.push(`Authority indicator: ${term}`)
        score += 10
      }
    })
    
    return { factors, score: Math.min(100, score) }
  }

  // Get comparison results
  const comparison = compareNamesFlexible(normInput, normExtracted)
  const documentAnalysis = analyzeDocumentStructure(extractedText)
  const eligibilityAssessment = assessEligibility(input.name, extractedText, input.extractedName)

  // Optional debug logging (can be enabled for troubleshooting)
  // console.log('=== VERIFICATION DEBUG ===')
  // console.log('Input:', normInput, 'Extracted:', normExtracted)
  // console.log('Comparison:', comparison)
  // console.log('Eligibility Assessment:', eligibilityAssessment)

  // Discrete Mathematics Implementation: Y = A ∧ E
  
  // Proposition A: Authenticity - Document is genuine and matches expected structure
  const authenticityScore = Math.min(100, 
    comparison.score * 0.7 + // Name matching weight (increased)
    (documentAnalysis.hasValidStructure ? 20 : 0) + // Structure validity
    (documentAnalysis.containsExpectedFields ? 10 : 0) - // Expected fields
    (documentAnalysis.suspiciousPatterns.length * 3) // Reduced penalty for suspicious patterns
  )
  
  // Balanced authenticity check - prioritize name matching but consider document quality
  const A_bool = (comparison.exactMatch && comparison.score >= 95) || // Perfect name match is highly authentic
                 (comparison.score >= 85 && authenticityScore >= 40) || // Very good name match with minimal doc requirements
                 (comparison.score >= 75 && 
                  (comparison.tokenOverlap >= 2 || 
                   (comparison.tokenOverlap >= 1 && comparison.overlapFraction >= 0.5)) && 
                  authenticityScore >= 50) // Good name match with decent document structure

  // Proposition E: Eligibility - Student meets criteria based on document content
  const eligibilityScore = eligibilityAssessment.score
  
  // Eligibility requires strong name matching - can't be eligible without proper name match
  const nameBonus = comparison.exactMatch ? 30 : 
                   (comparison.score >= 90 ? 20 : 
                   (comparison.score >= 75 ? 10 : 0))
  const adjustedEligibilityScore = Math.min(100, eligibilityScore + nameBonus)
  
  // Stricter eligibility check to prevent false positives
  const E_bool = comparison.score >= 70 && // MUST have good name match (increased from 60)
                 eligibilityScore > 40 && // Base eligibility must be reasonable (prevents negative scores from passing)
                 (adjustedEligibilityScore >= 70 || // Good adjusted score (increased threshold)
                 (eligibilityAssessment.factors.length >= 3 && adjustedEligibilityScore >= 60)) // More factors required with decent score

  // Final Decision: Y = A ∧ E (Admission granted only when both authenticity and eligibility are satisfied)
  const Y_bool = A_bool && E_bool

  const authenticity = {
    pass: A_bool,
    detail: `Authenticity verified: ${A_bool} (score: ${authenticityScore.toFixed(1)}/100, name match: ${comparison.score}/100, exact: ${comparison.exactMatch})`,
    score: authenticityScore
  }

  const eligibility = {
    pass: E_bool,
    detail: `Eligibility confirmed: ${E_bool} (base score: ${eligibilityScore}/100, adjusted: ${adjustedEligibilityScore}/100, factors: ${eligibilityAssessment.factors.length})`,
    score: adjustedEligibilityScore
  }

  const mathLogic = {
    pass: Y_bool,
    detail: `Y = A ∧ E => ${Y_bool} (Authenticity=${A_bool}, Eligibility=${E_bool})`,
    formula: "Y = A ∧ E (Y: Admission Decision, A: Authenticity, E: Eligibility)"
  }

  // Complete truth table for Y = A ∧ E
  const truthTable = {
    A: A_bool ? (1 as 1) : (0 as 0),
    E: E_bool ? (1 as 1) : (0 as 0),
    Y: Y_bool ? (1 as 1) : (0 as 0),
    table: [
      { A: 0 as 0, E: 0 as 0, Y: 0 as 0 }, // False ∧ False = False
      { A: 0 as 0, E: 1 as 1, Y: 0 as 0 }, // False ∧ True = False
      { A: 1 as 1, E: 0 as 0, Y: 0 as 0 }, // True ∧ False = False
      { A: 1 as 1, E: 1 as 1, Y: 1 as 1 }, // True ∧ True = True
    ] as Array<{ A: 0 | 1; E: 0 | 1; Y: 0 | 1 }>
  }

  return {
    authenticity,
    eligibility,
    mathLogic,
    truthTable,
    finalDecision: Y_bool ? "allowed" : "denied",
    normalizedNames: { input: normInput, extracted: normExtracted },
    verificationDetails: {
      nameMatch: { 
        exact: comparison.exactMatch, 
        score: comparison.score, 
        method: comparison.method 
      },
      documentAnalysis,
      eligibilityFactors: eligibilityAssessment.factors
    }
  }
}
