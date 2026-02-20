import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BinaryInsight",
  description: "Intelligent Pull Request & Code Review Management",
};

import { SessionProvider } from "@/components/SessionProvider";
// ... imports


import { AppNavbar } from "@/components/AppNavbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SessionProvider>
          <div className="min-h-screen">
            <AppNavbar />
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
