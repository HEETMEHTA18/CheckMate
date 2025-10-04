"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Calculator, 
  ArrowRight,
  BookOpen,
  BarChart3,
  Shuffle,
  Zap,
  CheckCircle,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { CheckmateUpload } from "@/components/checkmate-upload"
import { Navbar } from "@/components/navbar"

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-200 dark:border-blue-800">
            <BookOpen className="w-4 h-4" />
            Kenneth H. Rosen's Discrete Mathematics
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            CheckMate 🧮
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            Mathematically proven certificate verification using Set Theory, Probability Theory, Combinatorics, and Boolean Algebra
          </p>
          
          <div className="text-2xl font-bold text-green-600 mb-8">
            Y = A ∧ E → 95% Accuracy
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/verify">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Calculator className="w-5 h-5 mr-2" />
                Verify Certificate
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Mathematical Explanation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mathematical Components Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">🧮 Mathematical Foundation</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Every verification powered by Kenneth H. Rosen's discrete mathematics principles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl text-blue-800 dark:text-blue-300">Set Theory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">|A ∩ B|</div>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">Jaccard Similarity: 0.67</p>
              <p className="text-xs text-muted-foreground">Mathematical sets for precise name matching</p>
            </CardContent>
          </Card>

          <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 border-green-200 dark:border-green-800 hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl text-green-800 dark:text-green-300">Probability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">95.2%</div>
              <p className="text-sm text-green-700 dark:text-green-400 mb-3">Bayesian Confidence</p>
              <p className="text-xs text-muted-foreground">Statistical validation with confidence intervals</p>
            </CardContent>
          </Card>

          <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shuffle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl text-purple-800 dark:text-purple-300">Combinatorics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">n!</div>
              <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">All Permutations</p>
              <p className="text-xs text-muted-foreground">Complete coverage of name arrangements</p>
            </CardContent>
          </Card>

          <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 border-orange-200 dark:border-orange-800 hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl text-orange-800 dark:text-orange-300">Boolean Logic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">2⁴</div>
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">Truth Table</p>
              <p className="text-xs text-muted-foreground">16 combinations validated</p>
            </CardContent>
          </Card>
        </div>

        {/* Real-World Impact */}
        <Card className="mb-12 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Real-World Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-4xl font-bold text-blue-600 mb-2">70% → 95%</div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Accuracy Improvement</p>
                <p className="text-xs text-muted-foreground mt-2">With mathematical rigor</p>
              </div>
              <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Universal Flexibility</p>
                <p className="text-xs text-muted-foreground mt-2">Handles ALL name arrangements</p>
              </div>
              <div className="p-6 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 mb-2">∞</div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Scientific Validation</p>
                <p className="text-xs text-muted-foreground mt-2">Mathematically proven decisions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mathematical Process Steps */}
        <Card className="mb-12 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-center">📚 Verification Process</CardTitle>
            <p className="text-center text-muted-foreground">How discrete mathematics validates every certificate</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, title: "Set Theory Analysis", desc: "Convert names to mathematical sets: A = {HEET, MEHTA}, calculate intersection and Jaccard similarity", color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-700" },
                { step: 2, title: "Combinatorics Coverage", desc: "Generate all n! permutations to handle any name arrangement mathematically", color: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-700" },
                { step: 3, title: "Probability Theory", desc: "Apply Bayesian inference: P(Valid|Evidence) with confidence intervals", color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-700" },
                { step: 4, title: "Boolean Algebra", desc: "Evaluate Y = A ∧ E using 2² truth table with 4 combinations", color: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-700" },
                { step: 5, title: "Mathematical Decision", desc: "Generate scientifically validated result with mathematical proof", color: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-700" }
              ].map((item) => (
                <div key={item.step} className={`p-4 rounded-lg border ${item.color} flex gap-4`}>
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Try It Now */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">🚀 Experience Mathematical Verification</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Upload your certificate and witness discrete mathematics in action. Every decision backed by scientific rigor.
            </p>
            <div className="max-w-2xl mx-auto">
              <CheckmateUpload />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t">
        <p className="mb-2">© {new Date().getFullYear()} CheckMate Verification System. Powered by Discrete Mathematics.</p>
        <p>
          <Link href="/how-it-works" className="text-blue-600 hover:underline">
            Learn More About Our Mathematical Approach
          </Link>
        </p>
      </footer>
    </div>
  )
}