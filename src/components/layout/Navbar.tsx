"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/finance", label: "Finance" },
  { path: "/ai-ml", label: "AI/ML" },
  { path: "/mathematics", label: "Mathematics" },
  { path: "/research", label: "Research" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      const navLinksTotalWidth = navLinks.length * 100; // Approximate width of links
      const windowWidth = window.innerWidth;
      setShowMobileMenu(navLinksTotalWidth / windowWidth > 0.7);
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b-[3px] border-foreground
      py-4 bg-background shadow-brutal"
    >
      <div className="container mx-auto px-4">
        <nav className="flex justify-between items-center">
          <Link
            href="/"
            className="brutalist-border px-3 py-1 font-bold text-xl"
          >
            <span className="font-mono">Learning Quant</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {showMobileMenu ? (
              <>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="brutalist-button"
                  aria-label={isOpen ? "Close menu" : "Open menu"}
                >
                  {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 bg-background brutalist-border mt-2 py-4"
                    >
                      <ul className="flex flex-col items-center gap-4">
                        {navLinks.map((link) => (
                          <motion.li key={link.path} whileHover={{ x: 5 }}>
                            <Link
                              href={link.path}
                              className={`text-lg font-medium py-2 px-4 inline-block ${
                                pathname === link.path
                                  ? "underline underline-offset-4"
                                  : ""
                              }`}
                            >
                              {link.label}
                            </Link>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <ul className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <motion.li key={link.path} whileHover={{ y: -2 }}>
                    <Link
                      href={link.path}
                      className={`text-lg font-medium hover:underline hover:underline-offset-4 ${
                        pathname === link.path
                          ? "underline underline-offset-4"
                          : ""
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
