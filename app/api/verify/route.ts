import { type NextRequest, NextResponse } from "next/server";
import { verifyDocument } from "@/lib/logic";
import { validCertificates, normalizeName } from "@/lib/sample-db";
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
// Helper to extract fields from text
function extractFieldsFromText(text: string, inputName?: string): { name?: string; email?: string } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let name: string | undefined = undefined;
  let email: string | undefined = undefined;

  const normInputTokens = (inputName || "").toUpperCase().replace(/\s+/g, " ").trim().split(" ").filter(Boolean);

  // ...existing code...

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

  // Score candidate name lines to prefer real person names over labels like "APPLICATION NUMBER"
  function scoreLine(l: string) {
    let score = 0;
    const up = l.toUpperCase();
    // Strong positive signals
    if (/\bNAME\b/.test(up) || /\bAPPLICANT\b/.test(up) || /\bSTUDENT\b/.test(up) || /\bCANDIDATE\b/.test(up)) score += 50;
    // Negative signals: application numbers, labels, IDs
    if (/\bAPPLICATION\b/.test(up) || /\bNUMBER\b/.test(up) || /\bID\b/.test(up) || /\bREGISTRATION\b/.test(up)) score -= 40;
    // If the line contains many digits or long alphanumeric codes, penalize
    const digits = (l.match(/\d/g) || []).length;
    if (digits > 3) score -= 30;
    if (/\bRFSCH\b|\bCERT-\b|\bREF\b/.test(up)) score -= 30;

    const tokens = alphaTokens(l);
    score += Math.min(20, tokens.length * 10);

    // token overlap with inputName increases score
    if (normInputTokens.length > 0 && tokens.length > 0) {
      const upTokens = tokens.map(t => t.toUpperCase());
      // count exact and fuzzy overlaps
      let overlap = 0;
      for (const it of normInputTokens) {
        if (upTokens.includes(it)) { overlap += 1; continue; }
        // fuzzy: allow small Levenshtein distance up to 1 for short tokens or 2 for longer
        for (const ut of upTokens) {
          const d = levenshtein(it, ut);
          if ((ut.length <= 4 && d <= 1) || (ut.length > 4 && d <= 2)) { overlap += 1; break; }
        }
      }
      score += overlap * 25;
    }

    // Penalize lines that look like labels only (short tokens like "NAME" alone)
    if (/^[A-Z\s]{1,20}$/.test(up) && alphaTokens(l).length <= 1) score -= 10;

    return score;
  }

  // Build candidates and choose best-scoring line
  // Build candidates, but also split candidate lines into fragments if they contain multiple names
  let fragments: Array<{ fragment: string; score: number }> = [];
  for (const l of lines) {
    const base = normalizeText(l);
    // If line contains parenthetical ID like (24CE55), extract substring before '(' as likely name section
    const preParen = base.split('(')[0].trim();
    // Split by common separators (comma, semicolon, ' and ', '/') to handle multiple names on one line
    const parts = preParen.split(/,|;|\band\b|\//i).map(p => p.trim()).filter(Boolean);
    for (const p of parts) {
      const sc = scoreLine(p);
      fragments.push({ fragment: p, score: sc });
    }
    // also keep the whole line as a fallback fragment
    fragments.push({ fragment: preParen, score: scoreLine(preParen) });
  }

  fragments.sort((a, b) => b.score - a.score);
  if (fragments.length > 0 && fragments[0].score > -20) {
    const bestFrag = fragments[0].fragment;
    // If fragment contains colon/dash, take after it
    const colonMatch = bestFrag.match(/[:\-]\s*(.+)$/);
    let candidate = colonMatch ? colonMatch[1].trim() : bestFrag;
    // Prefer alpha tokens joining (ignore stray words like "CE" or "organized")
    const tokens = alphaTokens(candidate).map(t => normalizeText(t));
    if (tokens.length >= 2) {
      name = tokens.join(' ');
    } else if (tokens.length === 1 && normInputTokens.length > 0) {
      const t = tokens[0];
      if (t && normInputTokens.includes(t.toUpperCase())) name = t;
    } else {
      // last resort: accept the raw candidate trimmed
      name = candidate.trim();
    }
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
          // Fallback: OCR for all images in all pages
          try {
            // Attempt to load a Node-friendly legacy build of pdfjs at runtime.
            // Construct the module path dynamically so Next's build doesn't statically resolve it.
              // Try explicit, static imports in order to avoid webpack's
              // "request of a dependency is an expression" warning and to
              // make resolution predictable in Node. We try a few known
              // pdfjs-dist entry points that work in different installs.
              let pdfjsLib: any = null;
              let getDocument: any = null;
              let OPS: any = null;
              try {
                // Prefer the legacy ESM build when available
                pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
              } catch (e1) {
                try {
                  // Fallback to the top-level package; some installs expose APIs there
                  pdfjsLib = await import('pdfjs-dist');
                } catch (e3) {
                  throw new Error('PDF OCR fallback unavailable: pdfjs-dist not installed or failed to initialize. Install pdfjs-dist or provide a text-based PDF.');
                }
              }
              getDocument = pdfjsLib.getDocument || pdfjsLib.getDocument?.default || pdfjsLib.default?.getDocument;
              OPS = pdfjsLib.OPS || (pdfjsLib as any).ops || null;
              if (!getDocument) throw new Error('pdfjs-dist getDocument not available');
              const doc = await getDocument({ data: buffer }).promise;
              let ocrTexts: string[] = [];
              const numPages = doc.numPages;
              for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await doc.getPage(pageNum);
                  // Try to extract raster images from the page. pdfjs exposes
                  // different internal APIs depending on build; we try a few
                  // safe patterns without relying on computed module requests.
                  try {
                    const ops = await page.getOperatorList();
                    let imgData = null;
                    for (let i = 0; i < ops.fnArray.length; i++) {
                      // OPS may be undefined on some builds; guard access
                      if (OPS && ops.fnArray[i] === OPS.paintImageXObject) {
                        const imgName = ops.argsArray[i][0];
                        // page.objs.get may be synchronous or async depending on build
                        imgData = await page.objs.get(imgName);
                      }
                      if (imgData) {
                        // Use a static import for pngjs to keep the bundler happy
                        const { PNG } = await import('pngjs');
                        const png = new PNG({ width: imgData.width, height: imgData.height });
                        png.data = imgData.data;
                        const chunks: Buffer[] = [];
                        png.pack().on('data', (chunk: Buffer) => chunks.push(chunk));
                        await new Promise((resolve) => png.on('end', resolve));
                        const pngBuffer = Buffer.concat(chunks);
                        const formData = new FormData();
                        formData.append('file', new Blob([pngBuffer]), `page${pageNum}.png`);
                        try {
                          const ocrRes = await fetchOcrWithRetry(formData, 2);
                          const ocrData = await ocrRes.json();
                          ocrTexts.push(ocrData.text || "");
                        } catch (ocrPageErr) {
                          console.warn('OCR page upload failed for page', pageNum, ocrPageErr);
                        }
                      }
                    }
                  } catch (pageImgErr) {
                    // If image extraction fails for this page, continue to next page
                    console.warn('pdfjs page image extraction failed for page', pageNum, pageImgErr);
                  }
              }
              text = ocrTexts.join("\n");
              extracted = extractFieldsFromText(text);
              extractionSource = "pdf-ocr";
          } catch (pdfOcrErr) {
            // Don't throw a hard error here; PDF OCR fallback may fail in some environments
            // (pdfjs not available or image-only PDFs). Log the problem, mark extraction
            // source, and continue to attempt DB/filename/text-based fallbacks so we
            // can still return a deterministic VerificationResult rather than a 400.
            console.error("PDF extraction error (pdf-parse or pdf-ocr):", pdfParseError || pdfOcrErr);
            extractionSource = extractionSource ? extractionSource + ",pdf-ocr-failed" : "pdf-ocr-failed";
            // Clear any transient OCR text so downstream heuristics use DB/filename fallbacks
            text = "";
            extracted = {};
          }
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
      function bestCertificateMatch(inputName: string) {
        const normInput = normalizeName(inputName || "");
        const inputTokens = normInput.split(" ").filter(Boolean);
        let best: { cert: any; overlap: number } | null = null;
        for (const cert of validCertificates) {
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
        for (const cert of validCertificates) {
          if (cert.id && upfname.includes(cert.id.toUpperCase())) { certFromFilename = cert; break; }
        }
        if (certFromFilename) {
          chosenExtractedName = certFromFilename.name;
          extractionSource = extractionSource ? extractionSource + ",filename-db" : "filename-db";
        } else {
          const dbMatch = bestCertificateMatch(inputName);
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
        try {
          // bytes is an ArrayBuffer from File.arrayBuffer(); convert safely to Buffer
          const ab = bytes as ArrayBuffer;
          const rawBuf = Buffer.from(new Uint8Array(ab));
          if (rawBuf.byteLength > 0) {
            const bufStr = rawBuf.toString('utf8').toUpperCase();
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
          matches: { name: verifyOut.ownerStatus.pass, email: !!extracted.email && (extracted.email || "") === (inputEmail || "") },
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
