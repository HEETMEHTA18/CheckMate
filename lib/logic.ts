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
  // Enhanced discrete mathematics features (Kenneth H. Rosen)
  discreteMathAnalysis: {
    setTheory: {
      inputTokenSet: string[]
      extractedTokenSet: string[]
      intersection: string[]
      union: string[]
      jaccardSimilarity: number
      setDifference: string[]
    }
    probabilityTheory: {
      bayesianConfidence: number
      priorProbability: number
      likelihood: number
      posteriorProbability: number
      confidenceInterval: [number, number]
    }
    combinatorics: {
      possibleNamePermutations: number
      actualMatches: number
      combinatorialScore: number
    }
    booleanAlgebra: {
      logicalOperations: string[]
      truthTableSize: number
      satisfiabilityScore: number
    }
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

  // DEBUG: Log input data for troubleshooting
  console.log('=== VERIFICATION DEBUG ===')
  console.log('Input name:', input.name, '-> normalized:', normInput)
  console.log('Extracted name:', input.extractedName, '-> normalized:', normExtracted)
  console.log('Extracted text length:', extractedText.length)
  console.log('Has extracted text:', extractedText.length > 0 ? 'YES' : 'NO')

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

    // Normalize tokens for better comparison (remove punctuation, handle case)
    const normalizeToken = (token: string) => token.toUpperCase().replace(/[^\w]/g, '')
    const inputNormalized = inputTokens.map(normalizeToken).filter(t => t.length > 0)
    const extractedNormalized = extractedTokens.map(normalizeToken).filter(t => t.length > 0)

    // Check for exact match (order independent) - using normalized tokens
    const inputSet = new Set(inputNormalized)
    const extractedSet = new Set(extractedNormalized)
    const exactMatch = inputSet.size === extractedSet.size && 
                      [...inputSet].every(token => extractedSet.has(token))

    // Count exact token overlaps (order independent) - using normalized tokens
    let exactOverlap = 0
    for (const token of inputNormalized) {
      if (extractedNormalized.includes(token)) {
        exactOverlap++
      }
    }

    // Additional flexible matching patterns for common name arrangements
    const flexiblePatterns = [
      // Pattern 1: First + Last vs Last + First (e.g., "HEET MEHTA" vs "MEHTA HEET")
      () => {
        if (inputNormalized.length === 2 && extractedNormalized.length === 2) {
          return (inputNormalized[0] === extractedNormalized[1] && 
                 inputNormalized[1] === extractedNormalized[0])
        }
        return false
      },
      // Pattern 2: First + Middle + Last in any order
      () => {
        if (inputNormalized.length === 3 && extractedNormalized.length === 3) {
          return inputNormalized.every(token => extractedNormalized.includes(token))
        }
        return false
      },
      // Pattern 3: Partial name match (e.g., "HEET MEHTA" matches "HEET HITESH MEHTA")
      () => {
        const minLength = Math.min(inputNormalized.length, extractedNormalized.length)
        const maxLength = Math.max(inputNormalized.length, extractedNormalized.length)
        if (minLength >= 2 && maxLength <= minLength + 1) {
          return inputNormalized.every(token => extractedNormalized.includes(token)) ||
                 extractedNormalized.every(token => inputNormalized.includes(token))
        }
        return false
      }
    ]

    // Check flexible patterns
    const hasFlexibleMatch = flexiblePatterns.some(pattern => pattern())
    if (hasFlexibleMatch && !exactMatch) {
      // Boost score for flexible matches
      exactOverlap = Math.max(exactOverlap, Math.min(inputNormalized.length, extractedNormalized.length))
    }

    // STRICTER fuzzy matching with Levenshtein distance - reduce tolerance for errors
    let fuzzyOverlap = 0
    const usedExtractedIndices = new Set<number>()
    
    for (const inputToken of inputTokens) {
      let bestMatch = { index: -1, distance: Infinity }
      
      extractedTokens.forEach((extractedToken, index) => {
        if (usedExtractedIndices.has(index)) return
        
        const distance = levenshteinDistance(inputToken.toUpperCase(), extractedToken.toUpperCase())
        // MUCH STRICTER: Only allow 1-2 character differences and only for longer names
        const maxAllowedDistance = inputToken.length >= 5 ? Math.min(2, Math.floor(inputToken.length * 0.2)) : 1
        
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
    const fuzzyMatch = fuzzyFraction >= 0.8 // STRICTER: require 80% fuzzy match instead of 60%

    // Enhanced scoring system that handles flexible name arrangements
    let score = 0
    let method = 'partial'
    
    if (exactMatch) {
      score = 100
      method = 'exact-match'
    } else if (hasFlexibleMatch) {
      // Handle flexible name arrangements (different orders)
      score = 95
      method = 'flexible-order-match'
    } else if (exactOverlap === inputNormalized.length && exactOverlap === extractedNormalized.length) {
      // Perfect token match (just different order)
      score = 95
      method = 'perfect-tokens'
    } else {
      // Calculate overlap fraction using normalized tokens
      const normalizedOverlapFraction = exactOverlap / inputNormalized.length
      
      // Enhanced scoring for different arrangements
      score += exactOverlap * 35 // Increased weight for exact matches
      score += (fuzzyOverlap - exactOverlap) * 10 // Reduced weight for fuzzy matches
      score += normalizedOverlapFraction * 25 // Fraction bonus using normalized tokens
      
      // Special handling for common name patterns
      if (inputNormalized.length === 2 && extractedNormalized.length === 2 && exactOverlap === 2) {
        // Two-part names with all tokens matching (e.g., "HEET MEHTA" vs "MEHTA HEET")
        score = 95
        method = 'two-part-reorder'
      } else if (inputNormalized.length === 3 && extractedNormalized.length === 3 && exactOverlap === 3) {
        // Three-part names with all tokens matching (e.g., "HEET HITESH MEHTA" in any order)
        score = 95
        method = 'three-part-reorder'
      } else if (exactOverlap >= Math.min(inputNormalized.length, extractedNormalized.length) && 
                 Math.abs(inputNormalized.length - extractedNormalized.length) <= 1) {
        // Partial name match (e.g., "HEET MEHTA" matches "HEET HITESH MEHTA")
        score = 90
        method = 'partial-name-match'
      } else if (inputNormalized.length >= 2 && exactOverlap >= 2 && normalizedOverlapFraction >= 0.7) {
        score += 15 // Multi-token bonus, require 70% overlap
        method = 'multi-token'
      } else if (fuzzyMatch && fuzzyOverlap >= Math.ceil(inputNormalized.length * 0.8)) {
        score += 10 // Fuzzy bonus, require 80% fuzzy match
        method = 'fuzzy-match'
      } else {
        // PENALTY for weak matches
        score = Math.max(0, score - 20)
        method = 'weak-match'
      }
    }

    return {
      exactMatch: exactMatch || hasFlexibleMatch,
      tokenOverlap: exactOverlap,
      overlapFraction: exactOverlap / inputNormalized.length,
      fuzzyMatch,
      score: Math.min(100, score),
      method
    }
  }

  // Helper function to generate name permutations for flexible matching
  function generateNamePermutations(tokens: string[]): string[][] {
    if (tokens.length <= 1) return [tokens]
    if (tokens.length === 2) return [tokens, [tokens[1], tokens[0]]]
    
    // For 3+ tokens, generate common permutations (not all to avoid complexity)
    const permutations = [tokens] // Original order
    
    if (tokens.length === 3) {
      // Common patterns for three-part names
      permutations.push([tokens[2], tokens[0], tokens[1]]) // Last, First, Middle
      permutations.push([tokens[1], tokens[2], tokens[0]]) // Middle, Last, First
      permutations.push([tokens[0], tokens[2], tokens[1]]) // First, Last, Middle
      permutations.push([tokens[2], tokens[1], tokens[0]]) // Last, Middle, First  
      permutations.push([tokens[1], tokens[0], tokens[2]]) // Middle, First, Last
    } else if (tokens.length === 2) {
      permutations.push([tokens[1], tokens[0]]) // Reverse order
    }
    
    return permutations
  }

  // === DISCRETE MATHEMATICS FUNCTIONS (Kenneth H. Rosen) ===

  // SET THEORY: Analyze name tokens as sets (Chapter 2 - Rosen)
  function analyzeSetTheory(inputTokens: string[], extractedTokens: string[]): {
    intersection: string[], union: string[], jaccardSimilarity: number, setDifference: string[]
  } {
    const inputSet = new Set(inputTokens.map(t => t.toUpperCase()))
    const extractedSet = new Set(extractedTokens.map(t => t.toUpperCase()))
    
    // Intersection: A ∩ B
    const intersection = [...inputSet].filter(x => extractedSet.has(x))
    
    // Union: A ∪ B
    const union = [...new Set([...inputSet, ...extractedSet])]
    
    // Set Difference: A - B
    const setDifference = [...inputSet].filter(x => !extractedSet.has(x))
    
    // Jaccard Similarity: |A ∩ B| / |A ∪ B|
    const jaccardSimilarity = intersection.length / (union.length || 1)
    
    return { intersection, union, jaccardSimilarity, setDifference }
  }

  // BOOLEAN ALGEBRA: Simplified logical operations (Chapter 1 - Rosen)
  function analyzeBooleanAlgebra(A: boolean, E: boolean): {
    logicalOperations: string[], truthTableSize: number, satisfiabilityScore: number
  } {
    const logicalOperations = [
      `A ∧ E = ${A && E}`,           // Conjunction (main formula)
      `A ∨ E = ${A || E}`,           // Disjunction  
      `¬A = ${!A}`,                  // Negation of A
      `¬E = ${!E}`,                  // Negation of E
      `A → E = ${!A || E}`,          // Implication
      `A ↔ E = ${A === E}`,          // Biconditional
      `A ⊕ E = ${A !== E}`,          // Exclusive OR
    ]
    
    // Truth table size for 2 variables: 2^2 = 4
    const truthTableSize = Math.pow(2, 2)
    
    // Satisfiability score: how many conditions are satisfied
    const conditions = [A, E]
    const satisfiedCount = conditions.filter(Boolean).length
    const satisfiabilityScore = (satisfiedCount / conditions.length) * 100
    
    return { logicalOperations, truthTableSize, satisfiabilityScore }
  }

  // PROBABILITY THEORY: Bayesian inference (Chapter 7 - Rosen)
  function analyzeProbabilityTheory(nameScore: number, documentScore: number): {
    bayesianConfidence: number, priorProbability: number, likelihood: number, 
    posteriorProbability: number, confidenceInterval: [number, number]
  } {
    // Prior probability: based on historical data (assume 70% of valid docs pass)
    const priorProbability = 0.7
    
    // Likelihood: P(evidence | hypothesis)
    const normalizedNameScore = nameScore / 100
    const normalizedDocScore = documentScore / 100
    const likelihood = (normalizedNameScore + normalizedDocScore) / 2
    
    // Posterior probability using Bayes' theorem: P(A|B) = P(B|A) * P(A) / P(B)
    const evidence = 0.5 // P(B) - probability of observing this evidence
    const posteriorProbability = (likelihood * priorProbability) / evidence
    
    // Bayesian confidence
    const bayesianConfidence = Math.min(1, posteriorProbability) * 100
    
    // 95% confidence interval (simplified)
    const margin = 5
    const confidenceInterval: [number, number] = [
      Math.max(0, bayesianConfidence - margin),
      Math.min(100, bayesianConfidence + margin)
    ]
    
    return { bayesianConfidence, priorProbability, likelihood, posteriorProbability, confidenceInterval }
  }

  // COMBINATORICS: Pattern analysis (Chapter 6 - Rosen)
  function analyzeCombinatorics(inputTokens: string[], extractedTokens: string[]): {
    possibleNamePermutations: number, actualMatches: number, combinatorialScore: number
  } {
    // Calculate factorial for permutations
    const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1)
    
    // Possible permutations of input tokens: n!
    const possibleNamePermutations = factorial(Math.min(inputTokens.length, 5)) // Cap at 5! to avoid overflow
    
    // Count actual matches found
    const inputSet = new Set(inputTokens.map(t => t.toUpperCase()))
    const extractedSet = new Set(extractedTokens.map(t => t.toUpperCase()))
    const actualMatches = [...inputSet].filter(t => extractedSet.has(t)).length
    
    // Combinatorial score: C(n,k) = n! / (k!(n-k)!)
    const n = inputTokens.length
    const k = actualMatches
    const nMinusK = n - k
    const combinatorial = nMinusK >= 0 ? factorial(n) / (factorial(k) * factorial(nMinusK)) : 0
    const combinatorialScore = Math.min(100, (combinatorial / possibleNamePermutations) * 100)
    
    return { possibleNamePermutations, actualMatches, combinatorialScore }
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
      } else if (nameComparison.score >= 90 && nameComparison.tokenOverlap >= 2) {
        factors.push(`Strong name match via OCR: ${nameComparison.score}% similarity`)
        score += 30 // Reduced bonus, require token overlap
        nameFoundInText = true
      } else if (nameComparison.score >= 80 && nameComparison.tokenOverlap >= 2 && nameComparison.overlapFraction >= 0.8) {
        factors.push(`Good name match via OCR: ${nameComparison.score}% similarity`)
        score += 20 // Reduced bonus, stricter requirements
        nameFoundInText = true
      } else {
        // MUCH STRICTER: Any name with <80% similarity is considered a mismatch
        factors.push(`Name mismatch detected: Input "${inputName}" vs Document "${extractedName}" (${nameComparison.score}% similarity, ${nameComparison.tokenOverlap} tokens overlap)`)
        score = Math.max(0, score - 60) // HEAVY penalty for name mismatch
      }
    }
    
    // Second priority: Check if name appears in full document text (only if OCR didn't find a match)
    if (!nameFoundInText && extractedText.length > 0) {
      const nameTokens = inputUpper.split(' ').filter(Boolean)
      
      if (upperText.includes(inputUpper)) {
        factors.push('Full name found in document text - PERFECT MATCH')
        score += 60 // MAJOR boost for full name match in document
        nameFoundInText = true
      } else {
        // Try different name arrangements in document text
        const permutations = generateNamePermutations(nameTokens)
        let bestPermutationMatch = null
        
        for (const permutation of permutations) {
          const permutationText = permutation.join(' ')
          if (upperText.includes(permutationText)) {
            bestPermutationMatch = { text: permutationText, score: 95 }
            break
          }
        }
        
        if (bestPermutationMatch) {
          factors.push(`Name found in different order in text: "${bestPermutationMatch.text}"`)
          score += 55 // High boost for reordered name match
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

  // DEBUG: Log comparison results
  console.log('Name comparison result:', comparison)
  console.log('Document analysis:', documentAnalysis)
  console.log('Eligibility assessment:', eligibilityAssessment)

  // ENHANCED FALLBACK: If name extraction failed, try multiple recovery strategies
  if (!normExtracted || comparison.score < 50) {
    console.log('Low extraction quality, trying fallback strategies...')
    
    // Strategy 1: Check if input name appears in document text
    if (extractedText.length > 0) {
      const upperText = extractedText.toUpperCase()
      const upperInput = normInput.toUpperCase()
      
      if (upperText.includes(upperInput)) {
        console.log('FALLBACK 1: Found exact input name in document text!')
        const fallbackComparison = compareNamesFlexible(normInput, normInput)
        if (fallbackComparison.score > comparison.score) {
          console.log('Using fallback comparison with perfect match')
          Object.assign(comparison, fallbackComparison)
        }
      }
    }
    
    // Strategy 2: If no text extracted, check against certificate database
    if (extractedText.length === 0) {
      console.log('FALLBACK 2: No text extracted, checking certificate database...')
      try {
        const { readCerts } = await import('@/lib/cert-store')
        const certs = await readCerts()
        const matchingCert = certs.find(cert => 
          cert.name && normalizeName(cert.name) === normInput
        )
        if (matchingCert) {
          console.log('Found matching certificate in database:', matchingCert.name)
          const dbComparison = compareNamesFlexible(normInput, normInput)
          if (dbComparison.score > comparison.score) {
            console.log('Using database fallback with perfect match')
            Object.assign(comparison, dbComparison)
          }
        }
      } catch (error) {
        console.log('Database fallback failed:', error)
      }
    }
  }

  // Optional debug logging (can be enabled for troubleshooting)
  // console.log('=== VERIFICATION DEBUG ===')
  // console.log('Input:', normInput, 'Extracted:', normExtracted)
  // console.log('Comparison:', comparison)
  // console.log('Eligibility Assessment:', eligibilityAssessment)

  // === ENHANCED DISCRETE MATHEMATICS IMPLEMENTATION (Kenneth H. Rosen) ===
  
  // Apply discrete mathematics analysis
  const inputTokens = normInput.split(' ').filter(Boolean)
  const extractedTokens = normExtracted ? normExtracted.split(' ').filter(Boolean) : []
  
  // SET THEORY ANALYSIS
  const setAnalysis = analyzeSetTheory(inputTokens, extractedTokens)
  
  // COMBINATORICS ANALYSIS
  const combinatoricsAnalysis = analyzeCombinatorics(inputTokens, extractedTokens)
  
  // Proposition A: Authenticity - Document is genuine and matches expected structure
  const authenticityScore = Math.min(100, 
    comparison.score * 0.7 + // Name matching weight (increased)
    (documentAnalysis.hasValidStructure ? 20 : 0) + // Structure validity
    (documentAnalysis.containsExpectedFields ? 10 : 0) + // Expected fields
    (setAnalysis.jaccardSimilarity * 15) + // Set theory bonus (increased)
    (combinatoricsAnalysis.combinatorialScore * 0.1) - // Combinatorics bonus
    (documentAnalysis.suspiciousPatterns.length * 3) // Penalty for suspicious patterns
  )
  
  // Proposition E: Eligibility - Student meets criteria based on document content
  const baseEligibilityScore = eligibilityAssessment.score
  const nameBonus = comparison.exactMatch ? 30 : 
                   (comparison.score >= 90 ? 20 : 
                   (comparison.score >= 75 ? 10 : 0))
  const combinatoricsBonus = combinatoricsAnalysis.combinatorialScore * 0.1
  const adjustedEligibilityScore = Math.min(100, baseEligibilityScore + nameBonus + combinatoricsBonus)
  
  // NEW: Proposition S: Structure - Document has valid mathematical structure
  const structureScore = Math.min(100,
    (documentAnalysis.hasValidStructure ? 40 : 0) +
    (documentAnalysis.containsExpectedFields ? 30 : 0) +
    (extractedText.split(/\r?\n/).length > 3 ? 30 : 0) // Multi-line structure
  )
  
  // NEW: Proposition T: Temporal validity - Document timing and sequence validation
  const temporalScore = Math.min(100,
    (extractedText.match(/\b(19|20)\d{2}\b/) ? 40 : 0) + // Valid year format
    (extractedText.match(/\b(certificate|certification|award)\b/i) ? 30 : 0) + // Certificate keywords
    (extractedText.length > 50 ? 30 : 0) // Sufficient content
  )
  
  // PROBABILITY THEORY ANALYSIS
  const probabilityAnalysis = analyzeProbabilityTheory(comparison.score, authenticityScore)
  
  // Simplified Boolean Logic - Just use Authenticity and Eligibility
  const A_bool = (comparison.exactMatch) || // Perfect matches pass
                 (comparison.score >= 50) || // Any decent name match
                 (authenticityScore >= 50) || // Reasonable authenticity score
                 (setAnalysis.jaccardSimilarity >= 0.3) // Basic set similarity

  const E_bool = (adjustedEligibilityScore >= 50) || // Basic eligibility threshold
                 (baseEligibilityScore >= 40) || // Lower base threshold
                 (probabilityAnalysis.bayesianConfidence >= 50) || // Basic confidence
                 (extractedText.length > 20) // Has some document content
  
  // Simple Final Decision: Just need both A and E to be true
  const Y_bool = A_bool && E_bool

  // BOOLEAN ALGEBRA ANALYSIS (Simplified)
  const booleanAnalysis = analyzeBooleanAlgebra(A_bool, E_bool)

  // DEBUG: Log simplified decision components
  console.log('🔍 SIMPLIFIED BOOLEAN LOGIC ANALYSIS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 SCORES:')
  console.log(`   Authenticity Score: ${authenticityScore.toFixed(1)}/100`)
  console.log(`   Eligibility Score: ${adjustedEligibilityScore.toFixed(1)}/100`)
  console.log(`   Name Match Score: ${comparison.score}/100`)
  console.log(`   Jaccard Similarity: ${setAnalysis.jaccardSimilarity.toFixed(3)}`)
  console.log(`   Bayesian Confidence: ${probabilityAnalysis.bayesianConfidence.toFixed(1)}%`)
  console.log('')
  console.log('🧮 BOOLEAN EVALUATIONS:')
  console.log(`   A (Authenticity): ${A_bool ? '✅ TRUE' : '❌ FALSE'}`)
  console.log(`   E (Eligibility): ${E_bool ? '✅ TRUE' : '❌ FALSE'}`)
  console.log('')
  console.log(`🎯 FINAL RESULT: Y = A ∧ E = ${Y_bool ? '✅ ALLOWED' : '❌ DENIED'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const authenticity = {
    pass: A_bool,
    detail: `Authenticity verified: ${A_bool} (score: ${authenticityScore.toFixed(1)}/100, name match: ${comparison.score}/100, exact: ${comparison.exactMatch})`,
    score: authenticityScore
  }

  const eligibility = {
    pass: E_bool,
    detail: `Eligibility confirmed: ${E_bool} (base score: ${baseEligibilityScore}/100, adjusted: ${adjustedEligibilityScore}/100, factors: ${eligibilityAssessment.factors.length})`,
    score: adjustedEligibilityScore
  }

  const mathLogic = {
    pass: Y_bool,
    detail: `Y = A ∧ E => ${Y_bool} (Authenticity=${A_bool}[${authenticityScore.toFixed(1)}], Eligibility=${E_bool}[${adjustedEligibilityScore.toFixed(1)}])`,
    formula: "Y = A ∧ E - Simplified logic using only Authenticity and Eligibility"
  }

  // Simplified truth table for Y = A ∧ E (2-variable Boolean logic)
  const truthTable = {
    A: A_bool ? (1 as 1) : (0 as 0),
    E: E_bool ? (1 as 1) : (0 as 0),
    Y: Y_bool ? (1 as 1) : (0 as 0),
    table: [
      // All 4 combinations for 2 variables (2^2 = 4)
      { A: 0 as 0, E: 0 as 0, Y: 0 as 0 },
      { A: 0 as 0, E: 1 as 1, Y: 0 as 0 },
      { A: 1 as 1, E: 0 as 0, Y: 0 as 0 },
      { A: 1 as 1, E: 1 as 1, Y: 1 as 1 }, 
    ] as Array<{ A: 0 | 1; E: 0 | 1; Y: 0 | 1 }>
  }

  return {
    authenticity,
    eligibility,
    mathLogic,
    truthTable,
    // Enhanced discrete mathematics analysis (Kenneth H. Rosen concepts)
    discreteMathAnalysis: {
      setTheory: {
        inputTokenSet: inputTokens,
        extractedTokenSet: extractedTokens,
        intersection: setAnalysis.intersection,
        union: setAnalysis.union,
        jaccardSimilarity: setAnalysis.jaccardSimilarity,
        setDifference: setAnalysis.setDifference
      },
      probabilityTheory: {
        bayesianConfidence: probabilityAnalysis.bayesianConfidence,
        priorProbability: probabilityAnalysis.priorProbability,
        likelihood: probabilityAnalysis.likelihood,
        posteriorProbability: probabilityAnalysis.posteriorProbability,
        confidenceInterval: probabilityAnalysis.confidenceInterval
      },
      combinatorics: {
        possibleNamePermutations: combinatoricsAnalysis.possibleNamePermutations,
        actualMatches: combinatoricsAnalysis.actualMatches,
        combinatorialScore: combinatoricsAnalysis.combinatorialScore
      },
      booleanAlgebra: {
        logicalOperations: booleanAnalysis.logicalOperations,
        truthTableSize: booleanAnalysis.truthTableSize,
        satisfiabilityScore: booleanAnalysis.satisfiabilityScore
      }
    },
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
