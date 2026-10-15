import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PackageFit — Postpaid Package Recommendations",
  description: "Find suitable postpaid packages based on monthly usage and budget. Manage verified tariffs in the package catalogue.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
