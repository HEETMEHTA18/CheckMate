"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calculator, 
  Database, 
  FileText, 
  Zap,
  CheckCircle,
  ArrowRight,
  Layers,
  Brain,
  Network,
  Binary,
  Sparkles,
  ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { MathConceptVisualizer } from "@/components/math-concept-visualizer"  
import { CheckmateUpload } from "@/components/checkmate-upload"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import ConceptCard from '@/components/concept-card'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Navbar />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-primary/20">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Discrete Mathematics Application
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              CheckMate Verification System
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Advanced document verification using propositional logic, set theory, predicate logic, and Boolean algebra to ensure authenticity and eligibility.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/verify" className="inline-block">
                <Button size="lg" className="text-base px-8 py-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/how-it-works" className="inline-block">
                <Button variant="outline" size="lg" className="text-base px-8 py-6 border-primary text-primary hover:bg-primary/10 transition-all duration-300 shadow-lg hover:shadow-xl">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="transition-all duration-300 hover:-translate-y-2">
            <Card className="border-primary/20 hover:shadow-xl transition-all duration-300 h-full bg-card/50 backdrop-blur-sm border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <CardTitle>Document Processing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Extract text from PDFs, images, and text files using OCR and text parsing technologies.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="transition-all duration-300 hover:-translate-y-2">
            <Card className="border-primary/20 hover:shadow-xl transition-all duration-300 h-full bg-card/50 backdrop-blur-sm border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Calculator className="w-6 h-6 text-green-600 dark:text-green-300" />
                  </div>
                  <CardTitle>Mathematical Verification</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Apply discrete mathematics principles to verify name matching and document authenticity.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="transition-all duration-300 hover:-translate-y-2">
            <Card className="border-primary/20 hover:shadow-xl transition-all duration-300 h-full bg-card/50 backdrop-blur-sm border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <CardTitle>Database Validation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cross-reference with our certificate database using hash verification and set theory.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mathematical Concepts Visualization */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-xl bg-primary/10">
              <Layers className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Mathematical Concepts Visualization</h2>
            <Badge variant="secondary" className="ml-auto">Interactive</Badge>
          </div>
          <MathConceptVisualizer />
        </div>
      </div>

      {/* Concept cards (examples) */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ConceptCard
            title="Propositional Logic"
            difficulty="Foundational"
            conceptText="Propositional logic is used to determine if two names are logically equivalent by comparing their normalized forms."
            codeSnippet={`NameMatch = (InputName == ExtractedName)`}
            examples={[
              { title: 'Input:', content: '"Heet Hitesh Mehta"', tone: 'green' },
              { title: 'Extracted:', content: '"Mehta Heet Hitesh"', tone: 'green' },
            ]}
          />

          <ConceptCard
            title="Set Theory"
            difficulty="Intermediate"
            conceptText="Set theory is applied to verify that the set of words in the input name equals the set of words in the extracted name."
            codeSnippet={`Set(InputNameWords) = Set(ExtractedNameWords)`}
            examples={[
              { title: 'Input Name Set:', content: '{Heet, Hitesh, Mehta}', tone: 'blue' },
              { title: 'Extracted Name Set:', content: '{Mehta, Heet, Hitesh}', tone: 'purple' },
            ]}
          />

          <ConceptCard
            title="Predicate Logic"
            difficulty="Advanced"
            conceptText="Predicate logic ensures that every element in one set is present in the other set and vice versa."
            codeSnippet={`For all n, (n ∈ ExtractedName -> n ∈ InputName) \nFor all n, (n ∈ InputName -> n ∈ ExtractedName)`}
            examples={[{ title: 'Verification:', content: 'Predicate logic verification passed ✓', tone: 'green' }]}
          />
        </div>
      </div>

      {/* Complete Verification Process - Steps Card */}

      {/* Complete Verification Process - Steps Card */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="mx-auto max-w-6xl bg-white dark:bg-neutral-900 border border-border/40 dark:border-neutral-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold">Complete Verification Process</h2>
              <p className="text-muted-foreground mt-2">A step-by-step overview of how CheckMate verifies documents using discrete math principles.</p>
            </div>
          </div>

          <div className="space-y-6 mt-6">
            {[
              {n:1, title:'Document Upload', desc:'User uploads a certificate (PDF, image, or text file) and enters their full name.', color:'bg-blue-50/70 dark:bg-blue-900/10', border:'border-blue-200 dark:border-blue-800'},
              {n:2, title:'Text Extraction', desc:'System extracts text from the document using OCR for images/PDFs or direct parsing for text files.', color:'bg-green-50/70 dark:bg-green-900/8', border:'border-green-200 dark:border-green-800'},
              {n:3, title:'Name Normalization', desc:'Both input name and document name are normalized using tokenization, uppercasing, and sorting.', color:'bg-purple-50/70 dark:bg-purple-900/8', border:'border-purple-200 dark:border-purple-800'},
              {n:4, title:'Database Validation', desc:'System checks certificate ID, hash, and name against our database using set theory principles.', color:'bg-amber-50/70 dark:bg-amber-900/8', border:'border-amber-200 dark:border-amber-800'},
              {n:5, title:'Predicate Logic Verification', desc:'Ensures every element in one set is present in the other set and vice versa.', color:'bg-rose-50/70 dark:bg-rose-900/8', border:'border-rose-200 dark:border-rose-800'},
              {n:6, title:'Truth Table Evaluation', desc:'Applies truth table logic to determine final admission decision based on authenticity and eligibility.', color:'bg-cyan-50/70 dark:bg-cyan-900/8', border:'border-cyan-200 dark:border-cyan-800'},
              {n:7, title:'Final Decision', desc:'System provides comprehensive verification report with detailed explanations of all mathematical principles applied.', color:'bg-emerald-50/70 dark:bg-emerald-900/8', border:'border-emerald-200 dark:border-emerald-800'},
            ].map((step) => (
              <div key={step.n} className={`rounded-xl border ${step.border} p-6 flex items-center gap-6 ${step.color}`}>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold shadow-md">{step.n}</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Try CheckMate Now (moved to bottom) */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="mx-auto max-w-3xl bg-card/60 dark:bg-card/50 border border-border/40 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold">Try CheckMate Now</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a certificate and enter the student's full name to verify authenticity.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="bg-background/50 p-6 rounded-lg border border-border">
              <CheckmateUpload />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
