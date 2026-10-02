import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteChrome } from "@/components/montfort/layout/SiteChrome";
import { WebGLRoot } from "@/components/montfort/webgl/WebGLRoot";
import "./globals.css";
import "@/styles/montfort/index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Montfort Group",
  description: "Montfort is a global commodity trading and asset investment company.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Persistent across navigations, like the original's `transition:persist` chrome and canvas. */}
        <SiteChrome />
        <WebGLRoot />
        {children}
      </body>
    </html>
  );
}
