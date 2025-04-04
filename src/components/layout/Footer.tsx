"use client";

import Link from "next/link";
import { FiCoffee, FiMail } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="py-8 border-t-3 border-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="brutalist-border px-3 py-1 text-lg font-bold">
            <span className="font-mono">Learning Quant</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="mailto:samuel.j.heal@gmail.com"
              className="flex items-center gap-2 hover:underline underline-offset-4"
              aria-label="Email me"
            >
              <FiMail /> samuel.j.heal@gmail.com
            </a>

            <a
              href="https://buymeacoffee.com/samuelheal"
              target="_blank"
              rel="noopener noreferrer"
              className="brutalist-button flex items-center gap-2"
              aria-label="Buy me a coffee"
            >
              <FiCoffee /> Buy me a coffee
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <p>
            © {new Date().getFullYear()} Learning Quant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
