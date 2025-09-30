import React from "react";

export function Footer() {
  return (
    <footer className="w-full mt-12 border-t bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-muted-foreground flex items-center justify-between">
        <div>© {new Date().getFullYear()} CheckMate</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
