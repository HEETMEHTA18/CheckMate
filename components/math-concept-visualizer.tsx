"use client"
import { useState } from "react"

export function MathConceptVisualizer() {
  const [concept, setConcept] = useState("propositional-logic")

  return (
    <div className="bg-card/60 p-6 rounded-lg shadow-md border border-card/20">
      <div className="flex gap-4 items-start">
        <aside className="w-48">
          <ul className="space-y-2">
            <li>
              <button className={`w-full text-left p-2 rounded ${concept==="propositional-logic"?"bg-primary/10":"hover:bg-muted/5"}`} onClick={()=>setConcept("propositional-logic")}>
                Propositional Logic
              </button>
            </li>
            <li>
              <button className={`w-full text-left p-2 rounded ${concept==="set-theory"?"bg-primary/10":"hover:bg-muted/5"}`} onClick={()=>setConcept("set-theory")}>
                Set Theory
              </button>
            </li>
            <li>
              <button className={`w-full text-left p-2 rounded ${concept==="predicate-logic"?"bg-primary/10":"hover:bg-muted/5"}`} onClick={()=>setConcept("predicate-logic")}>
                Predicate Logic
              </button>
            </li>
            <li>
              <button className={`w-full text-left p-2 rounded ${concept==="boolean-algebra"?"bg-primary/10":"hover:bg-muted/5"}`} onClick={()=>setConcept("boolean-algebra")}>
                Boolean Algebra
              </button>
            </li>
          </ul>
        </aside>

        <div className="flex-1">
          {concept === "propositional-logic" && (
            <div>
              <h4 className="text-lg font-semibold mb-2">Propositional Logic</h4>
              <p className="text-sm text-muted-foreground mb-4">We use truth tables to evaluate propositions and prove equivalence between statements. For example, checking name equality can be seen as boolean propositions over tokens.</p>
              <table className="w-full text-sm table-fixed border-collapse">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="w-1/4">P</th>
                    <th className="w-1/4">Q</th>
                    <th>P ∧ Q</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>1</td><td>1</td></tr>
                  <tr><td>1</td><td>0</td><td>0</td></tr>
                  <tr><td>0</td><td>1</td><td>0</td></tr>
                  <tr><td>0</td><td>0</td><td>0</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {concept === "set-theory" && (
            <div>
              <h4 className="text-lg font-semibold mb-2">Set Theory</h4>
              <p className="text-sm text-muted-foreground mb-4">Model certificate registries as sets and perform membership tests using hashing and signature checks.</p>
              <pre className="bg-muted/5 p-3 rounded text-sm">{`A = { alice, bob, carol }
if x in A -> valid`}</pre>
            </div>
          )}

          {concept === "predicate-logic" && (
            <div>
              <h4 className="text-lg font-semibold mb-2">Predicate Logic</h4>
              <p className="text-sm text-muted-foreground mb-4">Use predicates to express properties about names: Name(x) and Matches(x, y) and check existential/universal conditions.</p>
            </div>
          )}

          {concept === "boolean-algebra" && (
            <div>
              <h4 className="text-lg font-semibold mb-2">Boolean Algebra</h4>
              <p className="text-sm text-muted-foreground mb-4">Construct boolean formulas to combine different evidence sources: OCR match, DB membership, signature check.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
