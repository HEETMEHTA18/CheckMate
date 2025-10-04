// Quick test for verification logic
const testCases = [
  {
    name: "HEET MEHTA",
    document: "This certificate is awarded to HEET MEHTA for completing the course.",
    expectedResult: "Should PASS - Good name match with document content"
  },
  {
    name: "MEHTA HEET",
    document: "Certificate awarded to HEET MEHTA for academic excellence in computer science.",
    expectedResult: "Should PASS - Reordered name should work with combinatorics"
  },
  {
    name: "JOHN DOE",
    document: "This certificate is awarded to HEET MEHTA for completing the course.",
    expectedResult: "Should FAIL - No name match"
  }
];

async function testVerification() {
  console.log('🧪 TESTING ENHANCED VERIFICATION LOGIC');
  console.log('=======================================\n');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: ${testCase.expectedResult}`);
    console.log(`Input: "${testCase.name}"`);
    console.log(`Document: "${testCase.document}"`);
    
    try {
      const response = await fetch('http://localhost:3001/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: testCase.name,
          extractedText: testCase.document
        })
      });

      if (!response.ok) {
        console.log(`❌ Request failed: ${response.status}`);
        continue;
      }

      const result = await response.json();
      
      console.log(`Result: ${result.finalDecision === 'allowed' ? '✅ ALLOWED' : '❌ DENIED'}`);
      console.log(`Truth Table: A=${result.truthTable.A}, E=${result.truthTable.E}, S=${result.truthTable.S}, T=${result.truthTable.T}, Y=${result.truthTable.Y}`);
      
      if (result.discreteMathAnalysis) {
        console.log(`Jaccard Similarity: ${result.discreteMathAnalysis.setTheory.jaccardSimilarity.toFixed(3)}`);
        console.log(`Bayesian Confidence: ${result.discreteMathAnalysis.probabilityTheory.bayesianConfidence.toFixed(1)}%`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('───────────────────────────────────────\n');
  }
}

// Run the test
testVerification().catch(console.error);