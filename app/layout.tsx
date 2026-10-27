import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Launchroom — a clearer handoff",
  description: "A working portfolio demonstration: campaign brief, validated request and a persistent production queue. Built by Dmitry Mikhailov.",
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
