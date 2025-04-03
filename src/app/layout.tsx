import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotesProvider } from "@/context/NotesContext";
import PyodideLoader from "@/components/blog/PyodideLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Learning Quant - Exploring Mathematics, AI/ML, and Quantitative Finance",
  description:
    "Educational blog focused on mathematics, machine learning, artificial intelligence, and quantitative finance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-200`}
      >
        <ThemeProvider>
          <NotesProvider>
            <Navbar />
            <main className="min-h-screen pt-20">{children}</main>
            <Footer />
            <PyodideLoader />
          </NotesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
