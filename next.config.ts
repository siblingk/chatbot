import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import createMDX from "@next/mdx";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const withMDX = createMDX({
  // Opciones de MDX aquí
});

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Permitir extensiones .mdx para archivos
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

// Combinar configuraciones de MDX y Next.js
export default withNextIntl(withMDX(nextConfig));
