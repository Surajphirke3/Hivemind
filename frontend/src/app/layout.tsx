import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { AppProviders } from "@/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HiveMind Protocol",
  description:
    "Decentralized collective intelligence network on Monad — multi-agent reasoning with verifiable provenance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <AppProviders>
          <SiteHeader />
          <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8">
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
