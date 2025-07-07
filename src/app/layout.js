import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "../components/ui/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BlueRush | アイスクリーム注文アプリ",
  description: "アイスクリーム店向けモバイルオーダーシステム - 簡単注文、QR整理券、リアルタイム在庫管理、商品管理機能を提供します。",
  keywords: "アイスクリーム,注文,モバイルオーダー,QRコード,整理券,在庫管理",
  authors: [{ name: "BlueRush Team" }],
  openGraph: {
    title: "BlueRush | アイスクリーム注文アプリ",
    description: "お客様のスマートフォンから簡単にアイスクリームを注文できるモバイルオーダーシステム",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlueRush | アイスクリーム注文アプリ",
    description: "お客様のスマートフォンから簡単にアイスクリームを注文できるモバイルオーダーシステム",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
