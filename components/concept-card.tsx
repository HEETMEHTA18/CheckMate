import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, CheckCircle, Circle, Code2 } from 'lucide-react'

type ExampleBox = {
  title: string
  content: React.ReactNode
  tone?: 'green' | 'blue' | 'purple' | 'cyan' | 'rose' | 'emerald'
}

export default function ConceptCard({
  title,
  difficulty,
  conceptText,
  codeSnippet,
  examples = [],
}: {
  title: string
  difficulty?: string
  conceptText: string
  codeSnippet?: string
  examples?: ExampleBox[]
}) {
  return (
    <Card className="rounded-2xl border border-border/40">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-green-600 dark:text-green-300" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-3">
              <span className="inline-flex items-center gap-2"><Circle className="w-4 h-4 text-muted-foreground" /> Concept</span>
            </div>
          </div>
        </div>
        {difficulty ? <Badge className="ml-auto">{difficulty}</Badge> : null}
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-muted-foreground mb-4">{conceptText}</p>
            {codeSnippet ? (
              <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm text-foreground">{codeSnippet}</div>
            ) : null}
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Example</h4>
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <div key={i} className={`p-4 rounded-lg border ${ex.tone === 'green' ? 'bg-green-50 border-green-200' : ex.tone === 'blue' ? 'bg-blue-50 border-blue-200' : ex.tone === 'purple' ? 'bg-purple-50 border-purple-200' : ex.tone === 'cyan' ? 'bg-cyan-50 border-cyan-200' : ex.tone === 'rose' ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{ex.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{ex.content}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
