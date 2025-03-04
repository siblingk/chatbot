import { NuqsClientWrapper } from "@/components/nuqs-client-wrapper";
import { ThemeProvider } from "@/components/theme/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsClientWrapper>{children}</NuqsClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
