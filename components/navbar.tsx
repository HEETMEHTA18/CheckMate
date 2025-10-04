"use client"
import Link from "next/link";
import React, { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X, Calculator } from "lucide-react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { theme, setTheme, systemTheme } = useTheme();
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const pathname = usePathname() || "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function NavLink({ href, children, mobile = false }: { href: string; children: React.ReactNode; mobile?: boolean }) {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={`${mobile ? 'block px-4 py-2 text-base' : 'text-sm px-3 py-2'} rounded-md transition-colors ${
          active 
            ? 'text-primary font-medium bg-primary/10 border border-primary/20' 
            : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
        }`}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        {children}
      </Link>
    );
  }

  return (
    <header className="w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CheckMate
              </span>
              <span className="text-[11px] text-muted-foreground -mt-1">Verification</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/how-it-works">How It Works</NavLink>
            <NavLink href="/verify">Verify</NavLink>
            <NavLink href="/admin-audit-log">Admin</NavLink>

            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="ml-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {resolvedTheme === 'dark' ? 
                <Sun className="w-5 h-5 text-yellow-500" /> : 
                <Moon className="w-5 h-5 text-slate-600" />
              }
            </button>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {resolvedTheme === 'dark' ? 
                <Sun className="w-5 h-5 text-yellow-500" /> : 
                <Moon className="w-5 h-5 text-slate-600" />
              }
            </button>
            <button
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-sm">
            <nav className="py-4 space-y-1">
              <NavLink href="/how-it-works" mobile>How It Works</NavLink>
              <NavLink href="/verify" mobile>Verify Certificate</NavLink>
              <NavLink href="/admin-audit-log" mobile>Admin Audit Log</NavLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
