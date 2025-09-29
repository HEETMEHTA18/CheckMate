import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
              Owner Status: {result.ownerStatus.pass ? "Verified Match" : "Mismatch"}
            </Badge>
            <Badge variant="outline" className="border-border">
              Math Logic: {result.mathLogic.pass ? "Names Match" : "No Match"}
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
            <h3 className="font-semibold">Introduction</h3>
            <p className="text-sm text-muted-foreground">
              This verification ensures the uploaded document is authentic, belongs to the claimed owner, exists in the
              reference database, and that the candidate satisfies eligibility. We employ Discrete Mathematics:
              propositional logic, set theory, predicate logic, and Boolean algebra.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Methodology</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Data Collection: user-provided name and uploaded PDF/image.</li>
              <li>Preprocessing: normalize names (case-insensitive, order-insensitive token sorting).</li>
              <li>Clause Checking: Name check (Propositional Logic) and membership (Set Theory).</li>
              <li>Eligibility: Check stored eligibility of matching certificate (Predicate Logic).</li>
              <li>Validation: Optional hash verification; Truth table evaluation for final decision.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Results</h3>
            <div className="text-sm space-y-2">
              <p>
                <strong>Name Check (Mathematical Logic)</strong> → {result.ownerStatus.pass ? "Pass" : "Fail"} — {result.ownerStatus.detail}
              </p>
              <p>
                <strong>Math Logic</strong> → {result.mathLogic.pass ? "Pass" : "Fail"} — {result.mathLogic.detail}
              </p>
              <p>
                <strong>Input Name:</strong> {result.normalizedNames.input}
              </p>
              <p>
                <strong>Extracted Name:</strong> {result.normalizedNames.extracted || "(none)"}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-md">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-3 py-2 text-left">A (Match)</th>
                      <th className="px-3 py-2 text-left">Y (Allowed = A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.truthTable.table.map((row, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="px-3 py-2">{row.A}</td>
                        <td className="px-3 py-2">{row.Y}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-border bg-accent">
                      <td className="px-3 py-2 font-semibold">A = {result.truthTable.A}</td>
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
          <p>Owner Status: {result.ownerStatus.pass ? "Verified Match..." : "Mismatch..."}</p>
          <p>Math Logic: {result.mathLogic.pass ? "Names Match..." : "No Match..."}</p>
          <p>Input Name: {result.normalizedNames.input}</p>
          <p>Extracted Name: {result.normalizedNames.extracted || "(none)"}</p>
          <p>Truth Table Evaluation: A={result.truthTable.A} → Y={result.truthTable.Y}</p>
          <p>Final Decision: Admission {result.truthTable.Y ? "Allowed ✅" : "Denied ❌"}</p>
        </CardContent>
      </Card>
    </div>
  )
}
