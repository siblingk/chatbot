"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Si no está montado, mostrar el contenido como texto plano con saltos de línea
  if (!isMounted) {
    return (
      <div className={className}>
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    );
  }

  // Componentes personalizados para ReactMarkdown
  const markdownComponents: Components = {
    h1: ({ children, ...props }) => (
      <h1 className="text-xl font-bold mb-2" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-lg font-bold mb-2" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-md font-bold mb-1" {...props}>
        {children}
      </h3>
    ),
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
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-primary underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
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
    <div className={className}>
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
