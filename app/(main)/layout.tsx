import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "sonner";
import { ChatProvider } from "@/contexts/chat-context";
import { NavBar } from "@/components/nav-bar";
import { SettingsModalProvider } from "@/contexts/settings-modal-context";
import { GlobalSettingsModal } from "@/components/settings/global-settings-modal";

import "@/app/globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ChatProvider>
              <LanguageProvider>
                <SettingsModalProvider>
                  <SidebarProvider defaultOpen={false}>
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
        </ThemeProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
