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
  // Enhanced discrete mathematics features
  discreteMathAnalysis?: {
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
            <h3 className="font-semibold">CheckMate - Your Certificate Checker</h3>
            <p className="text-sm text-muted-foreground">
              We check if your certificate is real and if it matches your name correctly. 
              We only approve certificates when both checks pass: the document must be genuine AND the name must match.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">How We Make Decisions</h3>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p><strong>Simple Rule:</strong> Both checks must pass</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>✅ <strong>Document Check:</strong> Is this certificate real?</li>
                <li>✅ <strong>Name Check:</strong> Does the name match yours?</li>
                <li>If both pass → You're approved ✅</li>
                <li>If either fails → Sorry, we can't verify ❌</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Your Results</h3>
            <div className="text-sm space-y-3">
              <div className="border rounded-md p-3">
                <p><strong>📄 Document Check</strong> → {result.authenticity.pass ? "✅ PASSED" : "❌ FAILED"}</p>
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
                  <p><strong>Name Comparison:</strong></p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Perfect Match: {result.verificationDetails.nameMatch.exact ? 'Yes ✅' : 'No ❌'}</li>
                    <li>Similarity Score: {result.verificationDetails.nameMatch.score}/100</li>
                  </ul>
                </div>
                <div className="mt-2">
                  <p><strong>Document Quality:</strong></p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Looks Real: {result.verificationDetails.documentAnalysis.hasValidStructure ? 'Yes ✅' : 'No ❌'}</li>
                    <li>Has Required Info: {result.verificationDetails.documentAnalysis.containsExpectedFields ? 'Yes ✅' : 'No ❌'}</li>
                    {result.verificationDetails.documentAnalysis.suspiciousPatterns.length > 0 && (
                      <li>Issues Found: {result.verificationDetails.documentAnalysis.suspiciousPatterns.join(', ')}</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="border rounded-md p-3">
                <p><strong>👤 Name Check</strong> → {result.eligibility.pass ? "✅ PASSED" : "❌ FAILED"}</p>
                <p className="text-muted-foreground mt-1">{result.eligibility.detail}</p>
                <div className="mt-2">
                  <p><strong>What We Checked:</strong></p>
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
                <h4 className="font-semibold mb-2">Truth Table for Y = A ∧ E ∧ S ∧ T</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Simplified Boolean truth table showing all 4 combinations (2²). Only when both conditions are TRUE does Y = 1.
                </p>
                <table className="w-full text-sm border border-border rounded-md">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-2 py-2 text-center">A</th>
                      <th className="px-2 py-2 text-center">E</th>
                      <th className="px-2 py-2 text-center">Y</th>
                      <th className="px-3 py-2 text-left">Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.truthTable.table.map((row, idx) => {
                      const isCurrentState = row.A === result.truthTable.A && 
                                            row.E === result.truthTable.E;
                      const isVerifiedRow = row.A === 1 && row.E === 1;
                      
                      return (
                        <tr key={idx} className={`border-t border-border ${
                          isCurrentState ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300' : 
                          isVerifiedRow ? 'bg-green-50 dark:bg-green-950/20' : ''
                        }`}>
                          <td className="px-2 py-2 text-center font-mono">{row.A}</td>
                          <td className="px-2 py-2 text-center font-mono">{row.E}</td>
                          <td className={`px-2 py-2 text-center font-mono font-bold ${
                            row.Y === 1 ? 'text-green-600' : 'text-red-600'
                          }`}>{row.Y}</td>
                          <td className="px-3 py-2 text-xs">
                            {isCurrentState && '← Current State: '}
                            {isVerifiedRow ? 'Both conditions satisfied - VERIFIED' : 
                             row.A === 0 ? 'Authenticity failed' :
                             row.E === 0 ? 'Eligibility failed' :
                             'At least one condition failed'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <h5 className="font-semibold text-sm mb-2">Current Verification State:</h5>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className={`p-3 rounded ${result.truthTable.A ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                      <strong>A = {result.truthTable.A}</strong><br/>
                      {result.truthTable.A ? 'Authentic ✓' : 'Not Authentic ✗'}
                    </div>
                    <div className={`p-3 rounded ${result.truthTable.E ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                      <strong>E = {result.truthTable.E}</strong><br/>
                      {result.truthTable.E ? 'Eligible ✓' : 'Not Eligible ✗'}
                    </div>
                    <div className={`p-3 rounded ${result.truthTable.Y ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
                      <strong>Y = {result.truthTable.Y}</strong><br/>
                      {result.truthTable.Y ? 'ADMITTED ✓' : 'DENIED ✗'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Discrete Mathematics Analysis */}
          {result.discreteMathAnalysis && (
            <section className="space-y-4">
              <h3 className="font-semibold">🧮 Discrete Mathematics Analysis</h3>
              <p className="text-xs text-muted-foreground">
                Enhanced analysis based on Kenneth H. Rosen's "Discrete Mathematics and Its Applications"
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Set Theory */}
                <div className="border rounded-md p-3 bg-blue-50/50 dark:bg-blue-950/20">
                  <h4 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-300">🔢 Set Theory Analysis</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Input Set:</strong> {"{" + result.discreteMathAnalysis.setTheory.inputTokenSet.join(", ") + "}"}</p>
                    <p><strong>Document Set:</strong> {"{" + result.discreteMathAnalysis.setTheory.extractedTokenSet.join(", ") + "}"}</p>
                    <p><strong>Intersection:</strong> {"{" + result.discreteMathAnalysis.setTheory.intersection.join(", ") + "}"}</p>
                    <p><strong>Union:</strong> {"{" + result.discreteMathAnalysis.setTheory.union.join(", ") + "}"}</p>
                    <p><strong>Jaccard Similarity:</strong> {result.discreteMathAnalysis.setTheory.jaccardSimilarity.toFixed(3)}</p>
                  </div>
                </div>

                {/* Probability Theory */}
                <div className="border rounded-md p-3 bg-green-50/50 dark:bg-green-950/20">
                  <h4 className="font-semibold text-sm mb-2 text-green-800 dark:text-green-300">📊 Probability Theory</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Bayesian Confidence:</strong> {result.discreteMathAnalysis.probabilityTheory.bayesianConfidence.toFixed(1)}%</p>
                    <p><strong>Prior Probability:</strong> {result.discreteMathAnalysis.probabilityTheory.priorProbability.toFixed(3)}</p>
                    <p><strong>Likelihood:</strong> {result.discreteMathAnalysis.probabilityTheory.likelihood.toFixed(3)}</p>
                    <p><strong>Posterior:</strong> {result.discreteMathAnalysis.probabilityTheory.posteriorProbability.toFixed(3)}</p>
                    <p><strong>Confidence Interval:</strong> [{result.discreteMathAnalysis.probabilityTheory.confidenceInterval[0].toFixed(1)}%, {result.discreteMathAnalysis.probabilityTheory.confidenceInterval[1].toFixed(1)}%]</p>
                  </div>
                </div>

                {/* Combinatorics */}
                <div className="border rounded-md p-3 bg-purple-50/50 dark:bg-purple-950/20">
                  <h4 className="font-semibold text-sm mb-2 text-purple-800 dark:text-purple-300">🎲 Combinatorics</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Possible Permutations:</strong> {result.discreteMathAnalysis.combinatorics.possibleNamePermutations}!</p>
                    <p><strong>Actual Matches:</strong> {result.discreteMathAnalysis.combinatorics.actualMatches}</p>
                    <p><strong>Combinatorial Score:</strong> {result.discreteMathAnalysis.combinatorics.combinatorialScore.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Boolean Algebra */}
                <div className="border rounded-md p-3 bg-orange-50/50 dark:bg-orange-950/20">
                  <h4 className="font-semibold text-sm mb-2 text-orange-800 dark:text-orange-300">⚡ Boolean Algebra</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Truth Table Size:</strong> {result.discreteMathAnalysis.booleanAlgebra.truthTableSize} combinations (2⁴)</p>
                    <p><strong>Satisfiability Score:</strong> {result.discreteMathAnalysis.booleanAlgebra.satisfiabilityScore.toFixed(1)}%</p>
                    <p><strong>Logical Operations:</strong></p>
                    <ul className="list-disc list-inside pl-2 space-y-0">
                      {result.discreteMathAnalysis.booleanAlgebra.logicalOperations.slice(0, 3).map((op, idx) => (
                        <li key={idx} className="font-mono text-[10px]">{op}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="font-semibold">Conclusion</h3>
            <p className="text-sm text-muted-foreground">
              Final Decision: Y = A ∧ E → {result.truthTable.A} ∧ {result.truthTable.E} = {result.truthTable.Y} {" "}
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
