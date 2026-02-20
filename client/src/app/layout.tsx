import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  variable: "--font-sans",
  weight: ["400", "700"],
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
import { GlobalRouteLoader } from "@/components/GlobalRouteLoader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${atkinsonHyperlegible.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <div className="min-h-screen">
            <AppNavbar />
            <GlobalRouteLoader />
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
