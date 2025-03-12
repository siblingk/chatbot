"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  onLinkClick?: (href: string) => void;
  onHeadingsFound?: (
    headings: { id: string; text: string; level: number }[]
  ) => void;
}

export function MarkdownRenderer({
  content,
  className,
  containerRef,
  onLinkClick,
  onHeadingsFound,
}: MarkdownRendererProps) {
  const t = useTranslations("settings");
  const [isMounted, setIsMounted] = useState(false);
  const localRef = useRef<HTMLDivElement>(null);
  const ref = containerRef || localRef;
  const [copiedHeadingId, setCopiedHeadingId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Extraer encabezados del contenido
  useEffect(() => {
    if (content && onHeadingsFound) {
      const extractedHeadings: { id: string; text: string; level: number }[] =
        [];

      // Buscar encabezados con regex
      const headingRegex = /^(#{1,6})\s+(.+?)(?:\s+\{#([^}]+)\})?$/gm;
      let match;

      while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const customId =
          match[3] ||
          text
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]/g, "");

        extractedHeadings.push({
          id: customId,
          text,
          level,
        });
      }

      onHeadingsFound(extractedHeadings);
    }
  }, [content, onHeadingsFound]);

  // Función para manejar clics en enlaces internos
  const handleLinkClick = (href: string, event: React.MouseEvent) => {
    if (href.startsWith("#")) {
      event.preventDefault();

      // Si hay un manejador de clics personalizado, úsalo
      if (onLinkClick) {
        onLinkClick(href);
        return;
      }

      // De lo contrario, intenta encontrar el elemento en el contenedor actual
      const targetId = href.substring(1);
      const container = ref.current;

      if (container) {
        // Buscar elementos con id o con data-heading-id
        const targetElement =
          container.querySelector(`#${targetId}`) ||
          container.querySelector(`[data-heading-id="${targetId}"]`);

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  // Función para copiar el enlace de un encabezado
  const copyHeadingLink = (id: string) => {
    const markdownLink = `[${id}](#${id})`;
    navigator.clipboard.writeText(markdownLink);
    setCopiedHeadingId(id);
    setTimeout(() => setCopiedHeadingId(null), 2000);
  };

  // Si no está montado, mostrar el contenido como texto plano con saltos de línea
  if (!isMounted) {
    return (
      <div className={className} ref={ref}>
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    );
  }

  // Componentes personalizados para ReactMarkdown
  const markdownComponents: Components = {
    h1: ({ children, ...props }) => {
      const id =
        typeof children === "string"
          ? children
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
          : "";
      return (
        <div className="group flex items-center gap-2 mb-2">
          <h1
            className="text-2xl font-bold"
            id={id}
            data-heading-id={id}
            {...props}
          >
            {children}
          </h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyHeadingLink(id)}
                >
                  {copiedHeadingId === id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copiedHeadingId === id ? t("copied") : t("copyHeadingLink")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    h2: ({ children, ...props }) => {
      const id =
        typeof children === "string"
          ? children
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
          : "";
      return (
        <div className="group flex items-center gap-2 mb-2">
          <h2
            className="text-xl font-bold"
            id={id}
            data-heading-id={id}
            {...props}
          >
            {children}
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyHeadingLink(id)}
                >
                  {copiedHeadingId === id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copiedHeadingId === id ? t("copied") : t("copyHeadingLink")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    h3: ({ children, ...props }) => {
      const id =
        typeof children === "string"
          ? children
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
          : "";
      return (
        <div className="group flex items-center gap-2 mb-1">
          <h3
            className="text-lg font-bold"
            id={id}
            data-heading-id={id}
            {...props}
          >
            {children}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyHeadingLink(id)}
                >
                  {copiedHeadingId === id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copiedHeadingId === id ? t("copied") : t("copyHeadingLink")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    h4: ({ children, ...props }) => {
      const id =
        typeof children === "string"
          ? children
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
          : "";
      return (
        <div className="group flex items-center gap-2 mb-1">
          <h4
            className="text-base font-semibold"
            id={id}
            data-heading-id={id}
            {...props}
          >
            {children}
          </h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyHeadingLink(id)}
                >
                  {copiedHeadingId === id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copiedHeadingId === id ? t("copied") : t("copyHeadingLink")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    h5: ({ children, ...props }) => {
      const id =
        typeof children === "string"
          ? children
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
          : "";
      return (
        <div className="group flex items-center gap-2 mb-1">
          <h5
            className="text-sm font-semibold"
            id={id}
            data-heading-id={id}
            {...props}
          >
            {children}
          </h5>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyHeadingLink(id)}
                >
                  {copiedHeadingId === id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copiedHeadingId === id ? t("copied") : t("copyHeadingLink")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    h6: ({ children, ...props }) => {
      const id =
        typeof children === "string"
          ? children
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")
          : "";
      return (
        <div className="group flex items-center gap-2 mb-1">
          <h6
            className="text-sm font-medium"
            id={id}
            data-heading-id={id}
            {...props}
          >
            {children}
          </h6>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyHeadingLink(id)}
                >
                  {copiedHeadingId === id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copiedHeadingId === id ? t("copied") : t("copyHeadingLink")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    p: ({ children, ...props }) => (
      <p className="mb-2" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-5 mb-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-5 mb-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="mb-1" {...props}>
        {children}
      </li>
    ),
    a: ({ children, href, ...props }) => {
      // Determinar si es un enlace interno o externo
      const isInternalLink = href?.startsWith("#");

      return isInternalLink ? (
        <a
          href={href}
          className="text-primary underline cursor-pointer"
          onClick={(e) => handleLinkClick(href || "", e)}
          {...props}
        >
          {children}
        </a>
      ) : (
        <a
          href={href}
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
    strong: ({ children, ...props }) => (
      <strong className="font-bold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-muted-foreground/30 pl-4 italic my-2"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({ children, className, ...props }) => {
      // Verificar si es código en línea o bloque basado en la clase
      const isInline = !className || !className.includes("language-");
      return isInline ? (
        <code
          className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      ) : (
        <code
          className="block bg-muted p-3 rounded-md overflow-x-auto my-2 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre
        className="bg-muted p-3 rounded-md overflow-x-auto my-2 text-sm font-mono"
        {...props}
      >
        {children}
      </pre>
    ),
    // Componentes para tablas (GFM)
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table
          className="min-w-full divide-y divide-muted-foreground/20"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-muted/50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="divide-y divide-muted-foreground/10" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    th: ({ children, ...props }) => (
      <th
        className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-2 text-sm" {...props}>
        {children}
      </td>
    ),
  };

  // Cuando está montado, renderizar como Markdown
  return (
    <div className={className} ref={ref}>
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
