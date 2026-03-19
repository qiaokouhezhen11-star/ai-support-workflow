import "./globals.css";
import type { Metadata } from "next";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";

export const metadata: Metadata = {
  title: "AI Inquiry Support Workflow",
  description: "AI問い合わせ対応支援アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isReadOnly = isReadOnlyDeployment();

  return (
    <html lang="ja">
      <body>
        {isReadOnly ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="mx-auto max-w-6xl">
              <p className="font-semibold">デモモード</p>
              <p className="mt-1">{getReadOnlyDeploymentMessage()}</p>
            </div>
          </div>
        ) : null}
        {children}
      </body>
    </html>
  );
}
