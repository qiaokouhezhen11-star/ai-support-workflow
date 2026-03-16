import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Inquiry Support Workflow",
  description: "AI問い合わせ対応支援アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}