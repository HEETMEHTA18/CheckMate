import React from "react";

export function LandingHero({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold">CheckMate</h1>
          <p className="mt-4 text-lg text-muted-foreground">Legal Rule & Document Verification System — verify certificates with discrete math and robust extraction.</p>
          <ul className="mt-6 list-disc pl-6 text-sm space-y-2 text-muted-foreground">
            <li>Fast PDF & image text extraction with OCR fallback</li>
            <li>Fuzzy, token-based matching and logic-driven decisions</li>
            <li>Audit logs, certificate registry, and printable reports</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <button onClick={onGetStarted} className="px-5 py-2 bg-primary text-primary-foreground rounded font-semibold">Get Started</button>
            <a href="#how" className="px-5 py-2 border rounded text-sm">How it works</a>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white/80 to-white/60 rounded-lg shadow p-6">
          <h3 className="font-semibold">Quick verify</h3>
          <p className="text-sm text-muted-foreground">Upload certificate and check ownership instantly.</p>
          <div className="mt-4">
            {/* The real upload component will be rendered on the page; this is a placeholder card */}
            <div className="p-4 border rounded bg-muted/20 text-sm text-muted-foreground">Upload a PDF or image to verify</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
