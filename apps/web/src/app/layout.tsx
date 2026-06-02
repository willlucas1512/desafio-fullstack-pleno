import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/providers";
import { VLibras } from "@/components/vlibras";
import { AccessibilityWidget } from "@/components/accessibility-widget";
import "./globals.css";

const ceraPro = localFont({
  src: [
    {
      path: "../../public/cera_pro_regular-webfont.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/cera_pro_medium-webfont.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/cera_pro_bold-webfont.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/cera_pro_black-webfont.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: [
    "system-ui",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: "Painel de Acompanhamento — PCRJ",
  description:
    "Painel para técnicos da Prefeitura acompanharem crianças em situação de vulnerabilidade social.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={ceraPro.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
        <VLibras />
        <AccessibilityWidget />
      </body>
    </html>
  );
}
