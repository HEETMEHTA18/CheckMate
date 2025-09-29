"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckmateUpload } from "@/components/checkmate-upload"
import Link from "next/link"

export default function Page() {
  const [showUpload, setShowUpload] = useState(false)
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-[#e0e7ff] via-[#f0fdfa] to-[#fef9c3]">
      <div className="w-full max-w-3xl">
        {!showUpload ? (
          <Card className="bg-white/90 shadow-2xl text-card-foreground border-0">
            <CardHeader className="text-center">
              <img src="/favicon.svg" alt="Check Mate Logo" className="mx-auto mb-4 w-16 h-16 rounded-full shadow-lg" />
              <CardTitle className="text-3xl font-extrabold tracking-tight text-primary mb-2">Check Mate</CardTitle>
              <CardDescription className="text-lg text-muted-foreground mb-4">
                Legal Rule & Document Verification System
              </CardDescription>
              <p className="text-base text-muted-foreground mb-6">
                Instantly verify certificates and documents for authenticity and eligibility using advanced logic and mathematics.<br/>
                <span className="font-semibold">Secure, Fast, Reliable.</span>
              </p>
              <button
                className="mt-4 px-6 py-2 rounded bg-primary text-primary-foreground font-semibold text-lg shadow hover:bg-primary/90 transition"
                onClick={() => setShowUpload(true)}
              >
                Get Started
              </button>
            </CardHeader>
          </Card>
        ) : (
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-pretty">CheckMate – Legal Rule & Document Verification System</CardTitle>
              <CardDescription className="text-muted-foreground">
                Upload a certificate (PDF/image) and enter the student&apos;s full name to verify authenticity and
                eligibility using discrete mathematics (propositional logic, set theory, predicate logic, and truth
                table).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CheckmateUpload />
            </CardContent>
          </Card>
        )}
              {/* Removed Get Started and Admin Audit Log buttons */}
      </div>
    </main>
  )
}
