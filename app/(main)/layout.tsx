import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

export const dynamic = "force-dynamic";

import { SidebarProvider } from "@/components/ui/sidebar";

import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "sonner";
import { ChatProvider } from "@/contexts/chat-context";
import { NavBar } from "@/components/nav-bar";
import { SettingsModalProvider } from "@/contexts/settings-modal-context";
import { GlobalSettingsModal } from "@/components/settings/global-settings-modal";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthRefresh } from "@/components/auth/auth-refresh";

import "@/app/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";

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

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <NuqsAdapter>
          <AuthProvider>
            <ChatProvider>
              <LanguageProvider>
                <SettingsModalProvider>
                  <SidebarProvider defaultOpen={false}>
                    <AuthRefresh />
                    <AppSidebar />
                    <div className="flex flex-col min-h-screen w-full">
                      <NavBar />
                      <main className="flex-1 mx-auto container">
                        {children}
                      </main>
                    </div>
                    <GlobalSettingsModal />
                  </SidebarProvider>
                </SettingsModalProvider>
              </LanguageProvider>
            </ChatProvider>
          </AuthProvider>
        </NuqsAdapter>
      </NextIntlClientProvider>

      <Toaster richColors position="top-right" />
    </div>
  );
}
