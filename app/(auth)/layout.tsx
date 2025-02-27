import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

export const dynamic = "force-dynamic";

import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "sonner";

import "@/app/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Siblingk",
  description: "Siblingk - Gestión de Talleres",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <main className="flex-1 mx-auto container">{children}</main>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
