import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wishnest — Big day. Your way.",
  description: "Your wishes, every occasion. Help your people find the right gift with budget matching and thoughtful reservation tools.",
  robots: { index: false, follow: false },
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
      <body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}
