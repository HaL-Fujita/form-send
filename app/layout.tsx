import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTMLメール生成ツール",
  description: "テキストをHTMLメールに自動変換 - Claude Sonnet API",
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
