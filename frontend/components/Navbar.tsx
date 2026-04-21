"use client";

import { useState } from "react";

const links = [
  { href: "#grade", label: "Grade Produce" },
  { href: "#prices", label: "Market Prices" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-agri-mid/30 bg-agri-dark shadow-md">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2 text-white">
          <span className="text-xl">🌿</span>
          <span className="font-display text-xl font-bold tracking-wide">AgriGrade AI</span>
        </a>

        <button
          type="button"
          className="rounded-md p-2 text-white md:hidden"
          aria-label="Toggle menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <ul className="hidden items-center gap-6 text-sm text-white md:flex">
          {links.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="border-b border-transparent pb-0.5 transition hover:border-white/80">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {isOpen ? (
        <div className="border-t border-white/15 bg-agri-dark/95 px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-2 text-sm text-white">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="block rounded-md px-2 py-2 transition hover:bg-agri-mid/50"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
