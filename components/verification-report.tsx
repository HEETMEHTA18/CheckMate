import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
}

export function VerificationReport({ result, inputName }: { result: VerificationResult; inputName: string }) {
  const decisionOk = result.finalDecision === "allowed"

  // Download as HTML file
  function handleDownload() {
    const html = document.getElementById('verification-report-content')?.outerHTML || '';
    const blob = new Blob([
      `<!DOCTYPE html><html><head><meta charset='utf-8'><title>Verification Report</title></head><body>${html}</body></html>`
    ], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verification-report.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Print the report
  function handlePrint() {
    const printContents = document.getElementById('verification-report-content')?.outerHTML || '';
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Verification Report</title></head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 self-end">
        <button onClick={handleDownload} className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs">Download</button>
        <button onClick={handlePrint} className="px-3 py-1 rounded bg-secondary text-secondary-foreground text-xs border">Print</button>
      </div>
      <Card className="bg-card" id="verification-report-content">
        <CardHeader>
          <CardTitle className="text-pretty">Verification Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* High-level summary */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-border">
              Authenticity: {result.authenticity.pass ? "✅ Verified" : "❌ Failed"} ({result.authenticity.score.toFixed(1)}/100)
            </Badge>
            <Badge variant="outline" className="border-border">
              Eligibility: {result.eligibility.pass ? "✅ Qualified" : "❌ Not Qualified"} ({result.eligibility.score.toFixed(1)}/100)
            </Badge>
            <Badge
              className={
                decisionOk ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
              }
            >
              Final Admission Decision: {decisionOk ? "Allowed ✅" : "Denied ❌"}
            </Badge>
          </div>

          <Separator className="bg-border" />

          {/* Step-by-step details */}
          <section className="space-y-2">
            <h3 className="font-semibold">CheckMate - Legal Rule Checker System</h3>
            <p className="text-sm text-muted-foreground">
              This verification system authenticates academic documents and validates eligibility using <strong>Discrete Mathematics</strong>. 
              The system applies propositional logic with the formula Y = A ∧ E, where admission is granted only when both 
              authenticity (A) and eligibility (E) conditions are satisfied.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Mathematical Logic: Y = A ∧ E</h3>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p><strong>Formula:</strong> {result.mathLogic.formula}</p>
              <p><strong>Interpretation:</strong></p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Admission is granted only when both conditions are satisfied</li>
                <li>If the document is fake or eligibility criteria are not met → Admission is denied</li>
                <li>Both authenticity AND eligibility must be true for admission approval</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Verification Results</h3>
            <div className="text-sm space-y-3">
              <div className="border rounded-md p-3">
                <p><strong>A (Authenticity)</strong> → {result.authenticity.pass ? "✅ PASS" : "❌ FAIL"}</p>
                <p className="text-muted-foreground mt-1">{result.authenticity.detail}</p>
                <div className="mt-2">
                  <p><strong>Name Analysis:</strong></p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Match Method: {result.verificationDetails.nameMatch.method}</li>
                    <li>Exact Match: {result.verificationDetails.nameMatch.exact ? 'Yes' : 'No'}</li>
                    <li>Confidence Score: {result.verificationDetails.nameMatch.score}/100</li>
                  </ul>
                </div>
                <div className="mt-2">
                  <p><strong>Document Structure:</strong></p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Valid Structure: {result.verificationDetails.documentAnalysis.hasValidStructure ? 'Yes' : 'No'}</li>
                    <li>Expected Fields Present: {result.verificationDetails.documentAnalysis.containsExpectedFields ? 'Yes' : 'No'}</li>
                    {result.verificationDetails.documentAnalysis.suspiciousPatterns.length > 0 && (
                      <li>Suspicious Patterns: {result.verificationDetails.documentAnalysis.suspiciousPatterns.join(', ')}</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="border rounded-md p-3">
                <p><strong>E (Eligibility)</strong> → {result.eligibility.pass ? "✅ PASS" : "❌ FAIL"}</p>
                <p className="text-muted-foreground mt-1">{result.eligibility.detail}</p>
                <div className="mt-2">
                  <p><strong>Eligibility Factors:</strong></p>
                  <ul className="list-disc pl-5 mt-1">
                    {result.verificationDetails.eligibilityFactors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                    {result.verificationDetails.eligibilityFactors.length === 0 && (
                      <li className="text-muted-foreground">No eligibility factors identified</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="border rounded-md p-3">
                <p><strong>Final Logic Evaluation:</strong> {result.mathLogic.detail}</p>
              </div>

              <p>
                <strong>Input Name:</strong> {result.normalizedNames.input}
              </p>
              <p>
                <strong>Extracted Name:</strong> {result.normalizedNames.extracted || "(none detected)"}
              </p>
              
              <div className="overflow-x-auto">
                <h4 className="font-semibold mb-2">Truth Table for Y = A ∧ E</h4>
                <table className="w-full text-sm border border-border rounded-md">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-3 py-2 text-left">A (Authenticity)</th>
                      <th className="px-3 py-2 text-left">E (Eligibility)</th>
                      <th className="px-3 py-2 text-left">Y (Admission)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.truthTable.table.map((row, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="px-3 py-2">{row.A}</td>
                        <td className="px-3 py-2">{row.E}</td>
                        <td className="px-3 py-2">{row.Y}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-primary bg-accent">
                      <td className="px-3 py-2 font-semibold">A = {result.truthTable.A}</td>
                      <td className="px-3 py-2 font-semibold">E = {result.truthTable.E}</td>
                      <td className="px-3 py-2 font-semibold">Y = {result.truthTable.Y}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Conclusion</h3>
            <p className="text-sm text-muted-foreground">
              Final Decision: Admission = A → {result.truthTable.A} = {result.truthTable.Y} {" "}
              —{" "}
              <span className={decisionOk ? "text-primary" : "text-destructive"}>
                {decisionOk ? "Admission Allowed ✅" : "Admission Denied ❌"}
              </span>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">References</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Propositional Logic and Boolean Algebra</li>
              <li>Set Theory (membership, element-of relation)</li>
              <li>Predicate Logic (universal implication for eligibility)</li>
            </ul>
          </section>
        </CardContent>
      </Card>

      {/* Output-style summary lines to mirror the provided example */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-pretty">Formatted Output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Verification {result.truthTable.Y === 1 ? "Successful" : "Unsuccessful"}...</p>
          <p>Mathematical verification completed</p>
          <p>Authenticity: {result.authenticity.pass ? "Verified (Score: " + result.authenticity.score.toFixed(1) + "/100)" : "Failed"}</p>
          <p>Eligibility: {result.eligibility.pass ? "Qualified (Score: " + result.eligibility.score.toFixed(1) + "/100)" : "Not Qualified"}</p>
          <p>Input Name: {result.normalizedNames.input}</p>
          <p>Extracted Name: {result.normalizedNames.extracted || "(none)"}</p>
          <p>Truth Table Evaluation: A={result.truthTable.A} → Y={result.truthTable.Y}</p>
          <p>Final Decision: Admission {result.truthTable.Y ? "Allowed ✅" : "Denied ❌"}</p>
        </CardContent>
      </Card>
    </div>
  )
}
