"use client"
import Link from "next/link";
import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { theme, setTheme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const pathname = usePathname() || "/";

  function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={`text-sm px-2 py-1 rounded-md ${active ? 'text-primary font-medium bg-primary/5' : 'text-muted-foreground hover:text-primary hover:bg-muted/5'}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <header className="w-full border-b bg-white/60 dark:bg-slate-900/60 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/favicon.svg" alt="CheckMate logo" className="w-10 h-10 rounded-md object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-lg">CheckMate</span>
            <span className="text-[11px] text-muted-foreground -mt-1">Verification</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <NavLink href="/how-it-works">How It Works</NavLink>
          <NavLink href="/verify">Verify</NavLink>
          <NavLink href="/admin-audit-log">Admin Audit Log</NavLink>

          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="ml-2 p-2 rounded-md hover:bg-muted/5"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
