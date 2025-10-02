import { type NextRequest, NextResponse } from "next/server";
import { verifyDocument } from "@/lib/logic";
import { normalizeName } from "@/lib/sample-db";
import { readCerts } from "@/lib/cert-store";
import { promises as fs } from "fs";
import path from "path";
// Small helper: retry fetch to OCR microservice with backoff
async function fetchOcrWithRetry(formData: FormData, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch('http://localhost:5001/ocr', { method: 'POST', body: formData });
      if (res.ok) return res;
      // non-OK: let it retry
    } catch (e) {
      console.warn('OCR fetch attempt failed', i, e);
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  throw new Error('OCR service unreachable');
}
// Small helper: Levenshtein distance for fuzzy matching of tokens
function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = [];
  for (let i = 0; i <= n; i++) dp[i] = i;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const cur = dp[j];
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j-1] + 1, prev + cost);
      prev = cur;
    }
  }
  return dp[n];
}
// Enhanced helper to extract fields from text with better name recognition
function extractFieldsFromText(text: string, inputName?: string): { name?: string; email?: string } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let name: string | undefined = undefined;
  let email: string | undefined = undefined;

  const normInputTokens = (inputName || "").toUpperCase().replace(/\s+/g, " ").trim().split(" ").filter(Boolean);

  // Helper: simple tokenization of alphabetic words
  function alphaTokens(s: string) {
    return s.split(/[^A-Z]/i).map(t => t.trim()).filter(t => /^[A-Za-z]{2,}$/.test(t));
  }

  // Remove diacritics and normalize spacing
  function normalizeText(s: string) {
    // NFKD decomposition and strip diacritics
    try {
      return s.normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim();
    } catch {
      // fallback
      return s.replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    }
  }

  // Enhanced name pattern detection
  function findNamePatterns(text: string, inputTokens: string[]): string[] {
    const candidates: string[] = []
    
    // Look for common name patterns in certificates
    const namePatterns = [
      /(?:name[:\s]+|student[:\s]+|candidate[:\s]+|applicant[:\s]+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:this\s+is\s+to\s+certify\s+that\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:presented\s+to\s+|awarded\s+to\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:hereby\s+certify\s+that\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    ]
    
    for (const pattern of namePatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const candidate = match[1].trim()
        if (candidate && candidate.length > 2 && /^[A-Za-z\s]+$/.test(candidate)) {
          candidates.push(candidate)
        }
      }
    }
    
    // Also look for capitalized words that might be names
    const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
    for (const word of words) {
      if (word.split(' ').length >= 2 && word.split(' ').length <= 4) {
        candidates.push(word)
      }
    }
    
    return candidates
  }

  // Enhanced scoring function for candidate name lines
  function scoreLine(l: string) {
    let score = 0;
    const up = l.toUpperCase();
    const tokens = alphaTokens(l);
    
    // Strong positive signals for name contexts
    if (/\b(?:NAME|APPLICANT|STUDENT|CANDIDATE|RECIPIENT|AWARDED TO|PRESENTED TO)\b/.test(up)) score += 50;
    if (/\b(?:THIS IS TO CERTIFY|HEREBY CERTIFY|CERTIFICATE OF)\b/.test(up)) score += 40;
    
    // Negative signals: administrative text, IDs, numbers
    if (/\b(?:APPLICATION|NUMBER|ID|REGISTRATION|SERIAL|CODE|REF)\b/.test(up)) score -= 40;
    if (/\b(?:SCHOLARSHIP|PROGRAM|COURSE|SUBJECT|MARKS|GRADE|CGPA|PERCENTAGE)\b/.test(up)) score -= 30;
    if (/\b(?:DATE|YEAR|MONTH|SIGNATURE|SEAL|PRINCIPAL|DIRECTOR)\b/.test(up)) score -= 25;
    
    // Penalize lines with too many digits or special characters
    const digits = (l.match(/\d/g) || []).length;
    const specialChars = (l.match(/[^\w\s]/g) || []).length;
    if (digits > 3) score -= 30;
    if (specialChars > 2) score -= 20;
    if (/\b(?:RFSCH|CERT-|REF|BATCH|ROLL)\b/.test(up)) score -= 30;

    // Reward proper name-like structure (2-4 capitalized words)
    if (tokens.length >= 2 && tokens.length <= 4) score += 30;
    if (tokens.length > 4) score -= 10; // Too many tokens, likely not a name
    
    // Check if tokens look like real names (common patterns)
    const namePatterns = tokens.filter(t => 
      /^[A-Z][a-z]{2,}$/.test(t) && // Proper capitalization
      t.length >= 3 && t.length <= 15 && // Reasonable length
      !/^(THE|AND|OF|IN|AT|ON|FOR|WITH|BY)$/i.test(t) // Not common words
    );
    score += namePatterns.length * 15;

    // Token overlap with input name (with fuzzy matching)
    if (normInputTokens.length > 0 && tokens.length > 0) {
      const upTokens = tokens.map(t => t.toUpperCase());
      let overlap = 0;
      let fuzzyOverlap = 0;
      
      for (const it of normInputTokens) {
        if (upTokens.includes(it)) { 
          overlap += 1; 
          continue; 
        }
        // Enhanced fuzzy matching
        for (const ut of upTokens) {
          const d = levenshtein(it, ut);
          const maxDistance = Math.max(1, Math.floor(Math.min(it.length, ut.length) * 0.3));
          if (d <= maxDistance) { 
            fuzzyOverlap += 1; 
            break; 
          }
        }
      }
      
      score += overlap * 30; // Exact matches are very valuable
      score += fuzzyOverlap * 15; // Fuzzy matches are also good
    }

    // Penalize obvious non-name patterns
    if (/^[A-Z\s]{1,20}$/.test(up) && tokens.length <= 1) score -= 15;
    if (l.length > 100) score -= 20; // Too long to be just a name
    if (l.length < 5) score -= 10; // Too short to be a full name

    return score;
  }

  // Enhanced candidate extraction with multiple strategies
  let candidates: Array<{ name: string; score: number; source: string }> = [];
  
  // Strategy 1: Pattern-based name extraction
  const patternNames = findNamePatterns(text, normInputTokens);
  for (const pname of patternNames) {
    const score = scoreLine(pname) + 20; // Bonus for pattern match
    candidates.push({ name: pname, score, source: 'pattern' });
  }
  
  // Strategy 2: Line-by-line analysis with fragments
  let fragments: Array<{ fragment: string; score: number }> = [];
  for (const l of lines) {
    const base = normalizeText(l);
    
    // Extract name from common certificate phrases
    const certPhrases = [
      /(?:this\s+is\s+to\s+certify\s+that\s+)(.+?)(?:\s+has\s+|$)/i,
      /(?:presented\s+to\s+|awarded\s+to\s+)(.+?)(?:\s+for\s+|$)/i,
      /(?:name\s*[:\-]\s*)(.+?)(?:\s*(?:roll|id|class|course)|$)/i,
      /(?:student\s*[:\-]\s*)(.+?)(?:\s*(?:roll|id|class|course)|$)/i,
    ];
    
    for (const phrase of certPhrases) {
      const match = base.match(phrase);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted.length > 2 && extracted.length < 100) {
          fragments.push({ fragment: extracted, score: scoreLine(extracted) + 30 });
        }
      }
    }
    
    // If line contains parenthetical ID like (24CE55), extract substring before '(' as likely name section
    const preParen = base.split('(')[0].trim();
    // Split by common separators to handle multiple names on one line
    const parts = preParen.split(/,|;|\sand\s|\//i).map(p => p.trim()).filter(Boolean);
    for (const p of parts) {
      const sc = scoreLine(p);
      fragments.push({ fragment: p, score: sc });
    }
    // also keep the whole line as a fallback fragment
    fragments.push({ fragment: preParen, score: scoreLine(preParen) });
  }

  fragments.sort((a, b) => b.score - a.score);
  
  // Convert top fragments to candidates
  for (let i = 0; i < Math.min(5, fragments.length); i++) {
    const frag = fragments[i];
    if (frag.score > -10) {
      const bestFrag = frag.fragment;
      // If fragment contains colon/dash, take after it
      const colonMatch = bestFrag.match(/[:\-]\s*(.+)$/);
      let candidate = colonMatch ? colonMatch[1].trim() : bestFrag;
      
      // Clean up the candidate
      const tokens = alphaTokens(candidate).map(t => normalizeText(t));
      if (tokens.length >= 2) {
        const cleanName = tokens.join(' ');
        candidates.push({ name: cleanName, score: frag.score, source: 'fragment' });
      } else if (tokens.length === 1 && normInputTokens.length > 0) {
        const t = tokens[0];
        if (t && normInputTokens.includes(t.toUpperCase())) {
          candidates.push({ name: t, score: frag.score, source: 'single-token' });
        }
      } else if (candidate.trim().length > 5) {
        // last resort: accept the raw candidate trimmed
        candidates.push({ name: candidate.trim(), score: frag.score - 10, source: 'raw' });
      }
    }
  }
  
  // Strategy 3: Direct input name search in text
  if (normInputTokens.length > 0) {
    const fullInputName = normInputTokens.join(' ');
    if (text.toUpperCase().includes(fullInputName.toUpperCase())) {
      candidates.push({ name: inputName || '', score: 100, source: 'direct-match' });
    }
  }
  
  // Choose the best candidate
  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length > 0 && candidates[0].score > -5) {
    name = candidates[0].name;
  }

  // Email: look for email pattern
  for (const l of lines) {
    const match = l.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) { email = match[0]; break; }
  }

  return { name, email };
}

export async function POST(req: NextRequest) {
  // Optional API key protection: if VERIFY_KEY is set in environment,
  // require requests to include header `x-verify-key` with that value.
  const requiredKey = process.env.VERIFY_KEY;
  if (requiredKey) {
    const headerKey = req.headers.get('x-verify-key') || req.headers.get('X-Verify-Key') || '';
    if (!headerKey || headerKey !== requiredKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  // capture some variables in outer scope for error logging
  let inputNameVal: string | null = null;
  let filenameVal: string | null = null;
  try {
    const incomingContentType = req.headers.get('content-type') || '';

    // If the client performed OCR in-browser, it will POST JSON: { name, extractedText, filename }
    if (incomingContentType.includes('application/json')) {
      const body = await req.json();
      const inputName = (body?.name as string) || "";
      inputNameVal = inputName;
      const inputEmail = (body?.email as string) || "";
      const filename = (body?.filename as string) || '';
      filenameVal = filename;
      const extractedText = (body?.extractedText as string) || '';

      // Perform lightweight extraction using existing helper
      const text = extractedText || '';
      let extracted = extractFieldsFromText(text, inputName);
      let extractionSource = 'client-ocr';

      // Helper to detect header-like names (reuse logic from below)
      function isHeaderLikeLocal(s?: string) {
        if (!s) return true;
        const up = s.toUpperCase();
        if (up.includes("SCHOLARSHIP") || up.includes("AWARD") || up.includes("APPLICATION") || up.includes("TOTAL VALUE") || up.includes("NAME OF")) return true;
        const digitCount = (s.match(/\d/g) || []).length;
        if (digitCount >= 3) return true;
        if (s.length > 120) return true;
        return false;
      }

      // Minimal best-certificate match used for fallback
      async function bestCertificateMatchLocal(inputName: string) {
        const certs = await readCerts();
        const normInput = normalizeName(inputName || "");
        const inputTokens = normInput.split(" ").filter(Boolean);
        let best: { cert: any; overlap: number } | null = null;
        for (const cert of certs) {
          const certTokens = (cert.name || "").split(" ").filter(Boolean);
          const overlap = inputTokens.filter((t) => certTokens.includes(t)).length;
          if (!best || overlap > best.overlap) best = { cert, overlap };
        }
        if (best && best.overlap >= 2) return best.cert;
        if (best && inputTokens.length > 0 && best.overlap / inputTokens.length >= 0.6) return best.cert;
        return null;
      }

      // Decide chosenExtractedName using extracted and DB/filename fallbacks
      let chosenExtractedName = extracted.name;
      if (!chosenExtractedName || isHeaderLikeLocal(chosenExtractedName)) {
        // try filename-based DB match
        const upfname = (filename || '').toUpperCase();
        let certFromFilename = null;
        const certs = await readCerts();
        for (const cert of certs) {
          if (cert.id && upfname.includes(cert.id.toUpperCase())) { certFromFilename = cert; break; }
        }
        if (certFromFilename) {
          chosenExtractedName = certFromFilename.name;
          extractionSource = extractionSource ? extractionSource + ',filename-db' : 'filename-db';
        } else {
          const dbMatch = await bestCertificateMatchLocal(inputName);
          if (dbMatch) {
            chosenExtractedName = dbMatch.name;
            extractionSource = extractionSource ? extractionSource + ',db-match' : 'db-match';
          }
        }
      }

      // Build verify input and run verification
      const verifyInput = { 
        name: inputName, 
        extractedName: chosenExtractedName, 
        extractedText: text,
        file: { bytes: Buffer.alloc(0).buffer as ArrayBuffer, filename } 
      };
      const verifyOut = await verifyDocument(verifyInput);

      const result = {
        ...verifyOut,
        extractionSource,
        textSample: (text || '').slice(0, 500),
        extracted: { ...extracted, chosen: chosenExtractedName },
        input: { name: inputName, email: inputEmail },
        file: { filename },
      };

      // Log attempt
      try {
        const logPath = path.join(process.cwd(), "logs.json");
        let logs: any[] = [];
        try { const data = await fs.readFile(logPath, 'utf8'); logs = JSON.parse(data); } catch {}
        logs.push({ date: new Date().toISOString(), input: { name: inputName, email: inputEmail }, extracted, matches: { name: verifyOut.authenticity.pass, eligibility: verifyOut.eligibility.pass }, file: filename || null, extractionSource });
        await fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf8');
      } catch (e) {}

      return NextResponse.json(result);
    }

    // Otherwise assume form-data upload (existing flow)
    const form = await req.formData();
    const inputName = (form.get("name") as string) || "";
    inputNameVal = inputName;
    const inputEmail = (form.get("email") as string) || "";
    const file = form.get("file") as File | null;
    if (!file) {
      throw new Error("No file uploaded. Please select a certificate PDF or image.");
    }
    if (typeof file !== 'object' || typeof file.arrayBuffer !== 'function' || typeof file.name !== 'string' || !file.name || (typeof file.size === 'number' && file.size === 0)) {
      throw new Error("Invalid file upload. Please select a real PDF or image file from your computer.");
    }
    const uploadedFile = file;
    const bytes = await uploadedFile.arrayBuffer();
    const filename = uploadedFile.name;
    filenameVal = filename;
    let extracted: { name?: string; email?: string } = {};
    let extractionSource = "";
    let text = "";
    const mime = (uploadedFile.type || "").toString();
      // include mime in logs for debugging
      // image OCR path
      if (mime.startsWith("image/")) {
        // OCR for images
        const formData = new FormData();
        formData.append('file', new Blob([bytes]), filename);
          try {
            const ocrRes = await fetchOcrWithRetry(formData, 2);
            const ocrData = await ocrRes.json();
            text = ocrData.text || "";
            extracted = extractFieldsFromText(text);
            extractionSource = "image-ocr";
          } catch (ocrErr) {
            console.warn('Image OCR failed or OCR service unreachable', ocrErr);
            extractionSource = extractionSource ? extractionSource + ",image-ocr-failed" : "image-ocr-failed";
          }
  } else if (mime === "application/pdf") {
        // PDF text extraction with robust fallback to OCR for all images
        const buffer = Buffer.from(bytes);
        if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 10) {
          throw new Error("Uploaded PDF file is empty or invalid. Please upload a valid certificate PDF.");
        }
        // Check PDF header: first 5 bytes should be '%PDF-'
        const pdfHeader = buffer.slice(0, 5).toString('utf8');
        if (pdfHeader !== '%PDF-') {
          throw new Error("Uploaded file is not a valid PDF. Please upload a real PDF file.");
        }
        let data;
        let pdfParseError = null;
        try {
          // Diagnostic: ensure we're passing a buffer (not a path)
          try {
            const firstBytes = buffer.slice(0, 16);
          } catch (diagErr) {
            console.warn('pdf-parse diagnostic failed to read buffer:', diagErr);
          }
            const safePdfParse = (await import('@/lib/safePdfParse')).default;
            data = await safePdfParse(buffer as Buffer);
        } catch (e) {
          pdfParseError = e;
        }
        text = (data && data.text) ? data.text : "";
        if (text.trim()) {
          extracted = extractFieldsFromText(text);
          extractionSource = "pdf-text";
        } else {
          // PDF has no extractable text - log and continue with empty text
          console.log('PDF contains no extractable text, continuing with text-based verification');
          text = "";
          extracted = {};
          extractionSource = "pdf-no-text";
        }
      }

      // If extracted name looks like a header or ID (e.g., contains 'SCHOLARSHIP' or many digits), prefer a DB match or filename match
      function isHeaderLike(s?: string) {
        if (!s) return true;
        const up = s.toUpperCase();
        if (up.includes("SCHOLARSHIP") || up.includes("AWARD") || up.includes("APPLICATION") || up.includes("TOTAL VALUE") || up.includes("NAME OF")) return true;
        const digitCount = (s.match(/\d/g) || []).length;
        if (digitCount >= 3) return true;
        // too long or contains many non-alpha characters
        if (s.length > 120) return true;
        return false;
      }

        // Try to find a certificate in the DB that best matches the input name
      async function bestCertificateMatch(inputName: string) {
        const certs = await readCerts();
        const normInput = normalizeName(inputName || "");
        const inputTokens = normInput.split(" ").filter(Boolean);
        let best: { cert: any; overlap: number } | null = null;
        for (const cert of certs) {
          const certTokens = (cert.name || "").split(" ").filter(Boolean);
          const overlap = inputTokens.filter(t => certTokens.includes(t)).length;
          if (!best || overlap > best.overlap) best = { cert, overlap };
        }
        // require at least 2-token overlap or 60% coverage
        if (best && best.overlap >= 2) return best.cert;
        if (best && inputTokens.length > 0 && best.overlap / inputTokens.length >= 0.6) return best.cert;
        return null;
      }

      // If extracted name is missing or clearly a header/ID, try filename and DB fallback
      let chosenExtractedName = extracted.name;
      if (!chosenExtractedName || isHeaderLike(chosenExtractedName)) {
        // filename may contain certificate id
        const upfname = (filename || "").toUpperCase();
        let certFromFilename = null;
        const certs = await readCerts();
        for (const cert of certs) {
          if (cert.id && upfname.includes(cert.id.toUpperCase())) { certFromFilename = cert; break; }
        }
        if (certFromFilename) {
          chosenExtractedName = certFromFilename.name;
          extractionSource = extractionSource ? extractionSource + ",filename-db" : "filename-db";
        } else {
          const dbMatch = await bestCertificateMatch(inputName);
          if (dbMatch) {
            chosenExtractedName = dbMatch.name;
            extractionSource = extractionSource ? extractionSource + ",db-match" : "db-match";
          } else {
            // as a last resort, try to find any line in OCR text with best overlap with input tokens
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const normInput = normalizeName(inputName || "");
            const inputTokens = normInput.split(" ").filter(Boolean);
            let bestLine: { line: string; overlap: number } | null = null;
            for (const l of lines) {
              const tokens = l.toUpperCase().replace(/[^A-Z ]+/g, " ").split(/\s+/).filter(Boolean);
              // compute fuzzy overlap: exact token matches or small levenshtein
              let overlap = 0;
              for (const it of inputTokens) {
                if (tokens.includes(it)) { overlap += 1; continue; }
                for (const tk of tokens) {
                  const d = levenshtein(it, tk);
                  if ((tk.length <= 4 && d <= 1) || (tk.length > 4 && d <= 2)) { overlap += 1; break; }
                }
              }
              if (!bestLine || overlap > bestLine.overlap) bestLine = { line: l, overlap };
            }
            if (bestLine && bestLine.overlap >= 1) {
              chosenExtractedName = bestLine.line;
              extractionSource = extractionSource ? extractionSource + ",text-best" : "text-best";
            }
          }
        }
      }

      // Raw-buffer fallback: sometimes OCR and pdf-parse both fail, but the input
      // name string still exists in the raw PDF bytes (often in an embedded text layer).
      // As a last-ditch effort, search the PDF buffer for a normalized input name
      // or its token subsequences and use it as the extracted name.
      if ((!chosenExtractedName || isHeaderLike(chosenExtractedName)) && bytes) {
        // prepare a buffer-string in outer scope for multiple fallbacks
        let bufStr = '';
        try {
          // bytes is an ArrayBuffer from File.arrayBuffer(); convert safely to Buffer
          const ab = bytes as ArrayBuffer;
          const rawBuf = Buffer.from(new Uint8Array(ab));
          if (rawBuf.byteLength > 0) {
            bufStr = rawBuf.toString('utf8').toUpperCase();
            const normInput = normalizeName(inputName || "");
            if (normInput) {
              const toks = normInput.split(' ').filter(Boolean);
              // direct full-name presence
              if (bufStr.includes(normInput.toUpperCase())) {
                chosenExtractedName = inputName;
                extractionSource = extractionSource ? extractionSource + ",raw-buffer" : "raw-buffer";
              } else {
                // count single-token presence (allow fuzzy match)
                let tokenMatches = 0;
                for (const tk of toks) {
                  if (bufStr.includes(tk.toUpperCase())) { tokenMatches++; continue; }
                  // fuzzy: allow small levenshtein matches in raw buffer by searching for close strings
                  // scan buffer for candidate words of similar length
                  const regexp = new RegExp("[A-Z]{" + Math.max(2, Math.min(20, tk.length-1)) + "," + (tk.length+1) + "}", 'g');
                  const matches = bufStr.match(regexp) || [];
                  for (const m of matches) {
                    const d = levenshtein(tk.toUpperCase(), m);
                    if ((m.length <= 4 && d <= 1) || (m.length > 4 && d <= 2)) { tokenMatches++; break; }
                  }
                }
                // look for 2..4-token subsequences (expand window to catch short multi-token names)
                let subseqFound = false;
                for (let w = 2; w <= Math.min(4, toks.length); w++) {
                  for (let i = 0; i + w <= toks.length; i++) {
                    const window = toks.slice(i, i + w).join(' ').toUpperCase();
                    if (bufStr.includes(window)) {
                      chosenExtractedName = toks.slice(i, i + w).join(' ');
                      extractionSource = extractionSource ? extractionSource + ",raw-buffer-subseq" : "raw-buffer-subseq";
                      subseqFound = true;
                      break;
                    }
                  }
                  if (subseqFound) break;
                }
                // if enough single-token evidence, accept the input name
                // For short names (2 tokens) accept 50% coverage (>=1 token) to avoid false-negatives
                const requiredTokenMatches = Math.max(1, Math.ceil(toks.length * 0.5));
                if (!chosenExtractedName && tokenMatches >= requiredTokenMatches) {
                  chosenExtractedName = inputName;
                  extractionSource = extractionSource ? extractionSource + `,raw-buffer-tokens(${tokenMatches}/${toks.length})` : `raw-buffer-tokens(${tokenMatches}/${toks.length})`;
                }
              }
            }
          }
        } catch (bufErr) {
          console.warn('Raw-buffer fallback failed', bufErr);
        }
        // Additional fuzzy-substring fallback: sometimes names appear in PDF bytes or OCR text
        // with punctuation/spacing differences. Normalize to letters-only and do a
        // sliding-window Levenshtein search to catch near-matches (small OCR errors).
        try {
          function normalizeLetters(s: string) {
            return (s || '').toUpperCase().replace(/[^A-Z]/g, '');
          }
          function fuzzySubstringSearch(hay: string, needle: string, maxDist: number) {
            if (!hay || !needle) return false;
            const H = normalizeLetters(hay);
            const N = normalizeLetters(needle);
            if (!H || !N) return false;
            const n = N.length;
            if (n === 0) return false;
            // scan windows of length n and allow small variations
            for (let i = 0; i + n <= H.length; i++) {
              const sub = H.substr(i, n);
              const d = levenshtein(sub, N);
              if (d <= maxDist) return true;
            }
            return false;
          }

          const needle = normalizeName(inputName || "");
          const needleLetters = needle.replace(/\s+/g, '');
          if (needleLetters.length >= 3 && !chosenExtractedName) {
            const maxDist = Math.max(1, Math.floor(needleLetters.length * 0.15));
            // check OCR text first (if any)
            if (text && fuzzySubstringSearch(text, needle, maxDist)) {
              chosenExtractedName = inputName;
              extractionSource = extractionSource ? extractionSource + ',fuzzy-substr-text' : 'fuzzy-substr-text';
            }
            // then check raw PDF buffer string
            if (!chosenExtractedName && bufStr && fuzzySubstringSearch(bufStr, needle, maxDist)) {
              chosenExtractedName = inputName;
              extractionSource = extractionSource ? extractionSource + ',fuzzy-substr-raw' : 'fuzzy-substr-raw';
            }
          }
        } catch (e) {
          // ignore fuzzy fallback errors
        }
      }

      // Use verifyDocument to compute the normalized result consistently
      const verifyInput = { name: inputName, extractedName: chosenExtractedName, file: { bytes, filename } };
      const verifyOut = await verifyDocument(verifyInput as any);

      // Attach internal details
      const result = {
        ...verifyOut,
        extractionSource,
        textSample: text.slice(0, 500),
        extracted: { ...extracted, chosen: chosenExtractedName },
        input: { name: inputName, email: inputEmail },
        file: { filename },
      };

      // Log the verification attempt
      try {
        const logPath = path.join(process.cwd(), "logs.json");
        let logs: any[] = [];
        try {
          const data = await fs.readFile(logPath, "utf8");
          logs = JSON.parse(data);
        } catch {}
        logs.push({
          date: new Date().toISOString(),
          input: { name: inputName, email: inputEmail },
          extracted,
          matches: { name: verifyOut.authenticity.pass, email: !!extracted.email && (extracted.email || "") === (inputEmail || "") },
          file: filename || null,
          extractionSource,
        });
        await fs.writeFile(logPath, JSON.stringify(logs, null, 2), "utf8");
      } catch (e) {
        // Ignore logging errors
      }

    return NextResponse.json(result);
  } catch (err: any) {
  const message = err?.message ?? "Verification failed";
    console.error("Verification error:", err);
    // Persist the error to logs.json for easier debugging
    try {
      const logPath = path.join(process.cwd(), "logs.json");
      let logs: any[] = [];
      try {
        const data = await fs.readFile(logPath, "utf8");
        logs = JSON.parse(data || "[]");
      } catch {}
  logs.push({ date: new Date().toISOString(), error: message, stack: err?.stack, input: { name: inputNameVal, file: filenameVal } });
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2), "utf8");
    } catch (logErr) {
      console.warn('Failed to write error to logs.json', logErr);
    }
    try {
      return NextResponse.json({ error: message }, { status: 400 });
    } catch (e) {
      return new NextResponse(message, { status: 400 });
    }
  }
}
