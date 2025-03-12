"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Link, Hash, Copy, Check } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface HeadingSelectorProps {
  instructionsHeadings: Heading[];
  documentationHeadings: Heading[];
  onInsertLink: (markdown: string) => void;
}

export function HeadingSelector({
  instructionsHeadings,
  documentationHeadings,
  onInsertLink,
}: HeadingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("instructions");
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedHeading, setSelectedHeading] = useState<Heading | null>(null);
  const [linkText, setLinkText] = useState("");

  // Filtrar encabezados según el término de búsqueda
  const filteredInstructionsHeadings = instructionsHeadings.filter((heading) =>
    heading.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocumentationHeadings = documentationHeadings.filter(
    (heading) => heading.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generar el markdown para el enlace
  const generateMarkdown = () => {
    if (!selectedHeading) return "";
    const text = linkText || selectedHeading.text;
    return `[${text}](#${selectedHeading.id})`;
  };

  // Insertar el enlace y cerrar el diálogo
  const handleInsertLink = () => {
    const markdown = generateMarkdown();
    if (markdown) {
      onInsertLink(markdown);
      setIsOpen(false);
      resetState();
    }
  };

  // Copiar el enlace al portapapeles
  const handleCopyLink = () => {
    const markdown = generateMarkdown();
    if (markdown) {
      navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Resetear el estado al cerrar el diálogo
  const resetState = () => {
    setSelectedHeading(null);
    setLinkText("");
    setSearchTerm("");
    setActiveTab("instructions");
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  // Renderizar un encabezado con indentación según su nivel
  const renderHeading = (heading: Heading, index: number) => {
    const indentation = "ml-" + (heading.level - 1) * 4;
    const headingPrefix = "#".repeat(heading.level) + " ";

    return (
      <Button
        key={index}
        variant={selectedHeading?.id === heading.id ? "default" : "ghost"}
        className={`w-full justify-start text-left ${indentation} mb-1`}
        onClick={() => setSelectedHeading(heading)}
      >
        <Hash className="h-4 w-4 mr-2 opacity-70" />
        <span className="font-mono text-xs opacity-50 mr-2">
          {headingPrefix}
        </span>
        {heading.text}
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Link className="h-4 w-4" />
          Insertar enlace a encabezado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Insertar enlace a encabezado</DialogTitle>
          <DialogDescription>
            Selecciona un encabezado para crear un enlace interno
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <Input
            placeholder="Buscar encabezados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="instructions">
                Instrucciones del Sistema
              </TabsTrigger>
              <TabsTrigger value="documentation">Documentación</TabsTrigger>
            </TabsList>

            <TabsContent
              value="instructions"
              className="max-h-[300px] overflow-y-auto border rounded-md p-2"
            >
              {filteredInstructionsHeadings.length > 0 ? (
                filteredInstructionsHeadings.map((heading, index) =>
                  renderHeading(heading, index)
                )
              ) : (
                <p className="text-center text-muted-foreground p-4">
                  {searchTerm
                    ? "No se encontraron encabezados"
                    : "No hay encabezados disponibles"}
                </p>
              )}
            </TabsContent>

            <TabsContent
              value="documentation"
              className="max-h-[300px] overflow-y-auto border rounded-md p-2"
            >
              {filteredDocumentationHeadings.length > 0 ? (
                filteredDocumentationHeadings.map((heading, index) =>
                  renderHeading(heading, index)
                )
              ) : (
                <p className="text-center text-muted-foreground p-4">
                  {searchTerm
                    ? "No se encontraron encabezados"
                    : "No hay encabezados disponibles"}
                </p>
              )}
            </TabsContent>
          </Tabs>

          {selectedHeading && (
            <div className="space-y-4 mt-4 border-t pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Texto del enlace (opcional)
                </label>
                <Input
                  placeholder={selectedHeading.text}
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Vista previa del enlace
                </label>
                <div className="p-2 bg-muted rounded-md font-mono text-sm">
                  {generateMarkdown()}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
                <Button onClick={handleInsertLink}>Insertar enlace</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
