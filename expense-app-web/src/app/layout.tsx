import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { PWAController } from "@/components/PWAController";

export const metadata: Metadata = {
  title: "Seva | ¿En qué se va mi plata?",
  description: "Controla tus gastos, ingresos y finanzas personales de forma simple e intuitiva.",
  manifest: "/manifest.json",
  applicationName: "Seva",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Seva",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

// Script to apply theme before first paint (prevents flash)
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('seva-theme');
    var parsed = stored ? JSON.parse(stored) : null;
    var theme = parsed?.state?.theme ?? 'system';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <PWAController />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
