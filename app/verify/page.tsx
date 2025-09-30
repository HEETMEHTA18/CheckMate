import React from "react";
import { Navbar } from "@/components/navbar";
import { CheckmateUpload } from "@/components/checkmate-upload";
import { VerificationReport } from "@/components/verification-report";

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Verify a Document</h1>
        <p className="text-muted-foreground mb-4">Upload a certificate (PDF or image) and enter the owner's full name.</p>

        <div className="bg-card/60 p-6 rounded shadow-sm">
          <CheckmateUpload />
        </div>
      </main>
    </div>
  );
}
