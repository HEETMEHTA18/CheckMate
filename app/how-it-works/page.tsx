import React from "react";
import Link from "next/link";
import { CheckmateUpload } from "../../components/checkmate-upload";
import { Navbar } from "../../components/navbar";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">How CheckMate works</h1>
          <p className="mt-2 text-muted-foreground">A lightweight explanation of the verification flow and the core ideas behind our approach.</p>
        </div>

        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-card/60 rounded-lg border border-border">
            <h2 className="text-xl font-semibold">Overview</h2>
            <p className="mt-3 text-sm text-muted-foreground">CheckMate applies lightweight discrete-math rules to verify whether a name in an uploaded certificate matches an input name. We combine reliable text extraction with simple logical checks so the results are clear and explainable.</p>

            <div className="mt-4 space-y-3">
              <div>
                <h3 className="font-medium">Text Extraction</h3>
                <p className="text-sm text-muted-foreground">Extract text from PDFs and images using embedded PDF text or OCR as needed.</p>
              </div>
              <div>
                <h3 className="font-medium">Normalization</h3>
                <p className="text-sm text-muted-foreground">Normalize names (case, punctuation, tokenization) so comparisons are robust to ordering and small formatting differences.</p>
              </div>
              <div>
                <h3 className="font-medium">Set-based Comparison</h3>
                <p className="text-sm text-muted-foreground">Compare the set of name tokens from input and extracted text to check logical equality.</p>
              </div>
              <div>
                <h3 className="font-medium">Decision</h3>
                <p className="text-sm text-muted-foreground">Combine authenticity checks with eligibility criteria to produce a final pass/fail decision and helpful diagnostics on failure.</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card/60 rounded-lg border border-border">
            <h2 className="text-xl font-semibold">Concepts in plain language</h2>
            <p className="mt-3 text-sm text-muted-foreground">Propositional / Set-based matching: we treat a normalized name as a set of tokens. If the two sets are equal, the names are considered equivalent.</p>

            <div className="mt-4 bg-background/30 p-4 rounded">
              <p className="font-semibold">Example</p>
              <pre className="mt-2 bg-muted/10 p-2 rounded text-sm">Input: "Heet Hitesh Mehta"</pre>
              <pre className="mt-2 bg-muted/10 p-2 rounded text-sm">Extracted: "Mehta Heet Hitesh"</pre>
              <pre className="mt-2 bg-muted/10 p-2 rounded text-sm">Normalized set: {'{Heet, Hitesh, Mehta}'}</pre>
              <p className="mt-2 text-green-500 font-semibold">Result: Equivalent ✓</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="p-6 bg-card/60 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold">Decision logic (brief)</h2>
            <p className="mt-2 text-sm text-muted-foreground">A simple truth-table combines checks like authenticity and eligibility to create a clear outcome. For the user, we show pass/fail and diagnostics explaining why a verification may have failed.</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Authenticity</th>
                    <th className="py-2">Eligibility</th>
                    <th className="py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">True</td>
                    <td className="py-2">True</td>
                    <td className="py-2 font-semibold">Allowed</td>
                  </tr>
                  <tr className="bg-muted/5">
                    <td className="py-2">True</td>
                    <td className="py-2">False</td>
                    <td className="py-2">Not allowed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="p-6 bg-card/60 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold">Complete verification process</h2>
            <ol className="list-decimal pl-6 mt-4 space-y-2 text-sm text-muted-foreground">
              <li><strong>Document upload</strong> — Upload your certificate (PDF, image or text) and enter the full name to check.</li>
              <li><strong>Text extraction</strong> — We try embedded PDF text first, then OCR when needed.</li>
              <li><strong>Name normalization</strong> — Both names are tokenized and normalized for comparison.</li>
              <li><strong>Set comparison & scoring</strong> — We compare token sets and compute a match score; fuzzy matching handles minor typos.</li>
              <li><strong>Database validation</strong> — If a certificate record exists, we cross-check to confirm authenticity.</li>
              <li><strong>Result & diagnostics</strong> — A clear pass/fail plus hints for retry or registration.</li>
            </ol>

            <div className="mt-6 bg-background/30 p-4 rounded">
              <h3 className="font-semibold">Try CheckMate</h3>
              <p className="text-sm text-muted-foreground mt-2">Use the verifier below to test a document now.</p>
              <div className="mt-4">
                <CheckmateUpload />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="p-4 text-sm text-muted-foreground bg-card/20 rounded">
            <h3 className="font-semibold">Developer notes (short)</h3>
            <p className="mt-2">During development the certificate store is file-backed at <code>data/certificates.json</code>. For production, migrate to a managed database and run the OCR service in a stable environment.</p>
          </div>
        </section>

        <footer className="mt-10 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CheckMate Verification System. All rights reserved.</p>
          <p className="mt-2">Back to <Link href="/">home</Link>.</p>
        </footer>
      </main>
    </div>
  );
}
