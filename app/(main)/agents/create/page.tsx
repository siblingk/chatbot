"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateAgent } from "@/app/actions/agents";
import {
  Agent,
  PersonalityTone,
  LeadStrategy,
  ExpirationTime,
} from "@/types/agents";
import { useAuth } from "@/contexts/auth-context";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import {
  Bot,
  ArrowLeft,
  Sparkles,
  Shield,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Settings,
  Copy,
  Edit,
  Check,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import AgentChatPreview from "@/components/chat/agent-chat-preview";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeadingSelector } from "@/components/ui/heading-selector";

export default function CreateAgentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const t = useTranslations();

  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: "siblignk-lead",
    model: "quote-builder-ai",
    visibility: "private",
    personality_tone: "Friendly",
    lead_strategy: "Smart-Targeting",
    welcome_message: `👋 ¡Hola! Bienvenido a Siblignk! 🚗💡 

Para comenzar con tu estimado, ¿podrías proporcionarme el **año, marca, modelo y el problema** que estás experimentando? 

Si no estás seguro del problema exacto, dime qué síntomas notas en tu vehículo y te ayudaré a identificarlo antes de calcular el presupuesto.  

Estoy aquí para asistirte en el proceso y brindarte la mejor solución posible. ¡Hagamos que tu auto vuelva a estar en perfectas condiciones! 🚀🔧`,
    pre_quote_message: `🎉 ¡Buenas noticias! Basándonos en reparaciones similares, tu estimado de precio se encuentra entre **$X - $Y**. 💰✨ 

🔹 Este estimado incluye piezas y mano de obra y puede variar según la inspección final.  

📅 ¿Te gustaría **asegurar un 10% de descuento en mano de obra**? ¡Reserva tu cita ahora! 🔗👇`,
    pre_quote_type: "Custom",
    expiration_time: "24 Hours",
    system_instructions: `# Instrucciones del Sistema

## Personalización de la Primera Interacción
- Si el lead proviene de un **Ad específico**, preguntar directamente por **Año, Marca, Modelo y Problema del Vehículo**.  
- Ejemplo de mensaje:  
  _"Hi there! Welcome to Siblignk! 🚗💡_  
  _To get started with your estimate, can you provide your vehicle's year, make, model, and the issue you're experiencing?"_  
- Configuración asociada: **Welcome Message** y **Lead Qualification Strategy (Smart Targeting)**  
- Si no se especifica el servicio en el Ad, mostrar la opción general.
- Para más detalles, consulta la [documentación sobre estrategias de leads](#estrategias-de-calificacion).

## Flujo del AI para Pre-Quote y Agendamiento

### Captura de Datos del Vehículo
- **Datos requeridos antes de generar la Pre-Quote:**  
  ✅ **Año**  
  ✅ **Marca**  
  ✅ **Modelo**  
  ✅ **Problema o Síntoma**  
- Configuración asociada: **Lead Qualification Strategy (Smart Targeting)**

### Generación de la Pre-Quote
- **Fuente de Precios:**  
  - **Si el taller tiene precios en Dcitelly:** Usar esos precios como base.  
  - **Si no hay precios en Dcitelly:** Usar **AI-Recommended Prices** basados en tendencias del mercado.  
- **Configuración asociada: Fuente de Precios (Dcitelly o AI-Recommended Prices)**
- Ver [configuración de precios](#configuracion-de-precios) en la documentación.

### Motivación para Convertir el Lead en una Cita
- Explicar al usuario por qué elegir Siblignk (**confianza, rapidez, descuento**).  
- Ofrecer el incentivo del **10% OFF en mano de obra**.  
- **Configuración asociada: Pre-Quote Message - Special Offer (10% OFF Labor)**

### Agendamiento de la Cita con un Taller Cercano
- Capturar información del usuario (**email y ZIP code**).  
- Buscar talleres cercanos en base a **Google Maps o Dcitelly**.  
- Asignar automáticamente al taller más cercano o permitir que el usuario elija.  
- **Configuración asociada: Workflow Automation - Auto-Assign Leads (ON)**

### Seguimiento y Recordatorio
- Enviar recordatorios si el lead no agenda en **3 horas** y **24 horas**.  
- Priorización de talleres con **mejores calificaciones en Google Maps**.  
- **Configuración asociada: Workflow Automation - AI Auto-Response (ON) + Lead Qualification Strategy (Smart Targeting)**`,
    documentation: `# Documentación del Agente

## Introducción
Este documento proporciona información detallada sobre las capacidades y configuraciones del agente de IA para la generación y gestión de leads en talleres automotrices.

## Índice
1. [Estrategias de Calificación](#estrategias-de-calificacion)
2. [Configuración de Precios](#configuracion-de-precios)
3. [Automatización de Flujo de Trabajo](#automatizacion-de-flujo)
4. [Mensajes Automáticos](#mensajes-automaticos)

## Estrategias de Calificación {#estrategias-de-calificacion}

### Smart Targeting
La estrategia Smart Targeting utiliza un enfoque adaptativo para recopilar información del cliente:
- Realiza preguntas progresivas basadas en respuestas anteriores
- Analiza el comportamiento del usuario para determinar su interés
- Prioriza leads con mayor probabilidad de conversión

Para configurar esta estrategia, consulta las [instrucciones del sistema sobre captura de datos](#captura-de-datos-del-vehiculo).

### Strict Filtering
La estrategia Strict Filtering establece requisitos obligatorios antes de procesar un lead:
- Exige información completa del vehículo
- Verifica datos de contacto
- Aplica filtros de calidad para evitar leads no calificados

## Configuración de Precios {#configuracion-de-precios}

### Integración con Dcitelly
Cuando el taller tiene precios configurados en Dcitelly:
- Los precios se sincronizan automáticamente
- Se calculan tarifas de mano de obra según configuración del taller
- Se aplican descuentos configurados

### Precios Recomendados por IA
Cuando no hay precios disponibles en Dcitelly:
- La IA analiza tendencias del mercado local
- Considera la complejidad del servicio
- Propone rangos de precios competitivos

## Automatización de Flujo de Trabajo {#automatizacion-de-flujo}

### Auto-Assign Leads
Cuando esta función está activada:
1. El sistema busca talleres cercanos al código postal del cliente
2. Analiza calificaciones y reseñas en Google Maps
3. Prioriza talleres según proximidad y calificación
4. Asigna automáticamente o presenta opciones al cliente

### AI Auto-Response
Gestiona la comunicación automática con el cliente:
- Envía recordatorios programados
- Responde preguntas frecuentes
- Ofrece promociones especiales para incentivar la conversión

## Mensajes Automáticos {#mensajes-automaticos}

### Recordatorios Configurados
El sistema envía los siguientes mensajes automáticos:

**Recordatorio de 3 horas:**
"Just checking in! We still have availability for your repair. Would you like to book your appointment now? 🚗💡"

**Recordatorio de 24 horas:**
"Limited-time offer! Schedule your appointment today and keep your 10% OFF labor discount!"`,
    auto_assign_leads: true,
    auto_respond: true,
    is_active: true,
    target_role: "both",
    user_id: user?.id || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [isEditingDocumentation, setIsEditingDocumentation] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("system-instructions");

  // Referencias para los contenedores de markdown
  const instructionsRef = useRef<HTMLDivElement>(null);
  const documentationRef = useRef<HTMLDivElement>(null);

  // Estado para almacenar los encabezados encontrados
  const [instructionsHeadings, setInstructionsHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
  const [documentationHeadings, setDocumentationHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);

  const handleCreateAgent = async () => {
    try {
      if (!newAgent.name) {
        toast.error(t("settings.errorCreatingAgent"));
        return;
      }

      setIsSubmitting(true);

      // Crear el agente sin generar un ID manualmente
      const agentToCreate: Partial<Agent> = {
        ...newAgent,
        user_id: user?.id || "",
      };

      await updateAgent(agentToCreate);
      toast.success(t("settings.agentCreated"));
      router.push(`/agents/${user?.id}`);
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error(t("settings.errorCreatingAgent"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInstructions = () => {
    if (newAgent.system_instructions) {
      navigator.clipboard.writeText(newAgent.system_instructions);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Función para manejar clics en enlaces internos entre pestañas
  const handleInternalLinkClick = (href: string) => {
    // Verificar en qué pestaña estamos actualmente
    const currentTab = activeTab;
    const targetId = href.substring(1); // Eliminar el # del inicio

    // Intentar encontrar el elemento en la pestaña actual
    const currentContainer =
      currentTab === "system-instructions"
        ? instructionsRef.current
        : documentationRef.current;

    if (currentContainer) {
      // Buscar el elemento con id o data-heading-id en el contenedor actual
      const targetElement =
        currentContainer.querySelector(`#${targetId}`) ||
        currentContainer.querySelector(`[data-heading-id="${targetId}"]`);

      if (targetElement) {
        // Si encontramos el elemento en la pestaña actual, desplazarse a él
        targetElement.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // Si no encontramos el elemento en la pestaña actual, intentar en la otra pestaña
    const otherTab =
      currentTab === "system-instructions"
        ? "documentation"
        : "system-instructions";
    setActiveTab(otherTab);

    // Esperar a que se renderice la otra pestaña antes de intentar desplazarse
    setTimeout(() => {
      const otherContainer =
        otherTab === "system-instructions"
          ? instructionsRef.current
          : documentationRef.current;

      if (otherContainer) {
        const targetElement =
          otherContainer.querySelector(`#${targetId}`) ||
          otherContainer.querySelector(`[data-heading-id="${targetId}"]`);

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    }, 100);
  };

  const renderBasicSettings = () => (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {t("settings.agentName")}
          </CardTitle>
          <CardDescription>{t("settings.enterAgentName")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={newAgent.name || ""}
            onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
            placeholder={t("settings.enterAgentNamePlaceholder")}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("settings.selectAIAgent")}
          </CardTitle>
          <CardDescription>{t("settings.chooseAIType")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={
                newAgent.model === "quote-builder-ai" ? "default" : "outline"
              }
              onClick={() =>
                setNewAgent({ ...newAgent, model: "quote-builder-ai" })
              }
              className="flex-1"
            >
              {t("settings.quoteBuilderAI")}
            </Button>
            <Button
              variant={newAgent.model === "omni-ai" ? "default" : "outline"}
              onClick={() => setNewAgent({ ...newAgent, model: "omni-ai" })}
              className="flex-1"
            >
              {t("settings.omniAI")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("settings.aiPersonality")}
          </CardTitle>
          <CardDescription>
            {t("settings.customizeAIInteraction")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Formal", "Friendly", "Sales-Driven", "Sales-Focused"].map(
              (tone) => (
                <Button
                  key={tone}
                  variant={
                    newAgent.personality_tone === tone ? "default" : "outline"
                  }
                  onClick={() =>
                    setNewAgent({
                      ...newAgent,
                      personality_tone: tone as PersonalityTone,
                    })
                  }
                  className="flex-1 min-w-[120px]"
                >
                  {tone}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {t("settings.systemInstructions")}
          </CardTitle>
          <CardDescription className="flex justify-between items-center">
            <span>{t("settings.systemInstructionsDescription")}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMoreSettings(!showMoreSettings)}
              className="ml-2"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showMoreSettings
                ? t("settings.lessSettings")
                : t("settings.moreSettings")}
              {showMoreSettings ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isEditingInstructions ? (
              <div className="space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded-md p-4 mb-4">
                  <h4 className="text-blue-800 dark:text-blue-200 font-bold text-base mb-2 flex items-center">
                    <Link className="h-5 w-5 mr-2" />
                    Crea enlaces a la documentación desde aquí
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                    Desde las instrucciones del sistema puedes crear enlaces a
                    cualquier sección de la documentación:
                  </p>
                  <ol className="list-decimal ml-5 text-blue-700 dark:text-blue-300 text-sm">
                    <li className="mb-1">
                      Escribe el texto que quieres que sea el enlace
                    </li>
                    <li className="mb-1">Selecciónalo con el cursor</li>
                    <li className="mb-1">
                      Haz clic en el botón{" "}
                      <span className="font-bold">
                        &quot;Insertar enlace a encabezado&quot;
                      </span>{" "}
                      abajo
                    </li>
                    <li className="mb-1">
                      Selecciona el encabezado de destino en la documentación
                    </li>
                  </ol>
                </div>
                <div className="flex justify-end mb-2">
                  <HeadingSelector
                    instructionsHeadings={instructionsHeadings}
                    documentationHeadings={documentationHeadings}
                    onInsertLink={(markdown) => {
                      const textarea =
                        document.activeElement as HTMLTextAreaElement;
                      if (
                        textarea &&
                        textarea.tagName.toLowerCase() === "textarea"
                      ) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const value = textarea.value;
                        const newValue =
                          value.substring(0, start) +
                          markdown +
                          value.substring(end);
                        setNewAgent({
                          ...newAgent,
                          system_instructions: newValue,
                        });
                        // Establecer el cursor después del enlace insertado
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(
                            start + markdown.length,
                            start + markdown.length
                          );
                        }, 0);
                      } else {
                        // Si no hay un textarea activo, simplemente añadir al final
                        setNewAgent({
                          ...newAgent,
                          system_instructions:
                            (newAgent.system_instructions || "") +
                            "\n" +
                            markdown,
                        });
                      }
                    }}
                  />
                </div>
                <Textarea
                  value={newAgent.system_instructions || ""}
                  onChange={(e) =>
                    setNewAgent({
                      ...newAgent,
                      system_instructions: e.target.value,
                    })
                  }
                  placeholder={t("settings.systemInstructionsPlaceholder")}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute bg-sidebar left-2 top-3 text-sm text-muted-foreground">
                  Markdown
                </div>
                <div className="absolute bg-sidebar right-2 top-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyInstructions}
                    title={t("settings.copy")}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingInstructions(true)}
                    title={t("settings.edit")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 min-h-[250px] overflow-y-auto bg-sidebar rounded-md">
                  {newAgent.system_instructions ? (
                    <div className="mt-6">
                      <MarkdownRenderer
                        content={newAgent.system_instructions || ""}
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-6 italic">
                      {t("settings.noContentToPreview")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMoreSettings = () => (
    <div className="space-y-8 mt-8">
      <div className="border-t pt-6 mb-4">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-primary" />
          {t("settings.additionalSettings")}
        </h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("settings.leadStrategy")}
          </CardTitle>
          <CardDescription>
            {t("settings.determineLeadFiltering")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={
                newAgent.lead_strategy === "Strict-Filtering"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setNewAgent({
                  ...newAgent,
                  lead_strategy: "Strict-Filtering" as LeadStrategy,
                })
              }
              className="flex-1"
            >
              {t("settings.strictFiltering")}
            </Button>
            <Button
              variant={
                newAgent.lead_strategy === "Smart-Targeting"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setNewAgent({
                  ...newAgent,
                  lead_strategy: "Smart-Targeting" as LeadStrategy,
                })
              }
              className="flex-1"
            >
              {t("settings.smartTargeting")}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>{t("settings.leadStrategyDescription")}</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("settings.welcomeMessage")}
          </CardTitle>
          <CardDescription>
            {t("settings.welcomeMessageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="standard" className="w-full mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="standard" className="flex-1">
                {t("settings.standardBotChat")}
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex-1">
                {t("settings.customWelcomeMessage")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Textarea
            placeholder={t("settings.welcomeMessagePlaceholder")}
            value={newAgent.welcome_message || ""}
            onChange={(e) => {
              const newMessage = e.target.value;
              setNewAgent({ ...newAgent, welcome_message: newMessage });
            }}
            className="min-h-[100px]"
          />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>{t("settings.welcomeMessageDescription")}</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("settings.preQuoteMessage")}
          </CardTitle>
          <CardDescription>
            {t("settings.preQuoteMessageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t("settings.preQuoteMessagePlaceholder")}
            value={newAgent.pre_quote_message}
            onChange={(e) =>
              setNewAgent({ ...newAgent, pre_quote_message: e.target.value })
            }
            className="min-h-[100px]"
          />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>{t("settings.preQuoteMessageDescription")}</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t("settings.expirationTime")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["24 Hours", "3 Hours", "7 Days", "Custom"].map((time) => (
              <Button
                key={time}
                variant={
                  newAgent.expiration_time === time ? "default" : "outline"
                }
                onClick={() =>
                  setNewAgent({
                    ...newAgent,
                    expiration_time: time as ExpirationTime,
                  })
                }
                className="flex-1 min-w-[100px]"
              >
                {time}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>{t("settings.expirationTimeDescription")}</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {t("settings.workflowAutomation")}
          </CardTitle>
          <CardDescription>
            {t("settings.workflowAutomationDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>{t("settings.autoAssignLeads")}</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("settings.autoAssignLeadsDescription")}
                </p>
              </div>
              <Switch
                checked={newAgent.auto_assign_leads}
                onCheckedChange={(checked) =>
                  setNewAgent({ ...newAgent, auto_assign_leads: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>{t("settings.aiAutoResponse")}</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("settings.aiAutoResponseDescription")}
                </p>
              </div>
              <Switch
                checked={newAgent.auto_respond}
                onCheckedChange={(checked) =>
                  setNewAgent({ ...newAgent, auto_respond: checked })
                }
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>{t("settings.workflowAutomationDescription")}</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("settings.visibility")}
          </CardTitle>
          <CardDescription>
            {t("settings.agentVisibilityDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={newAgent.visibility}
            onValueChange={(value: "private" | "public") =>
              setNewAgent({ ...newAgent, visibility: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("settings.selectVisibility")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <div className="flex items-center">{t("settings.private")}</div>
              </SelectItem>
              <SelectItem value="public">
                <div className="flex items-center">{t("settings.public")}</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <p>{t("settings.visibilityDescription")}</p>
        </CardFooter>
      </Card>
    </div>
  );

  const renderDocumentation = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("settings.documentation")}</h3>
        <div className="flex space-x-2">
          {isEditingDocumentation ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditingDocumentation(false);
                toast.success(t("settings.documentationSaved"));
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              {t("settings.done")}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingDocumentation(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t("settings.edit")}
            </Button>
          )}
        </div>
      </div>

      {isEditingDocumentation ? (
        <div className="space-y-4">
          <div className="flex justify-end mb-2">
            <HeadingSelector
              instructionsHeadings={instructionsHeadings}
              documentationHeadings={documentationHeadings}
              onInsertLink={(markdown) => {
                const textarea = document.activeElement as HTMLTextAreaElement;
                if (textarea && textarea.tagName.toLowerCase() === "textarea") {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const value = textarea.value;
                  const newValue =
                    value.substring(0, start) + markdown + value.substring(end);
                  setNewAgent({
                    ...newAgent,
                    documentation: newValue,
                  });
                  // Establecer el cursor después del enlace insertado
                  setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(
                      start + markdown.length,
                      start + markdown.length
                    );
                  }, 0);
                } else {
                  // Si no hay un textarea activo, simplemente añadir al final
                  setNewAgent({
                    ...newAgent,
                    documentation:
                      (newAgent.documentation || "") + "\n" + markdown,
                  });
                }
              }}
            />
          </div>
          <div className="border rounded-md p-2 bg-muted/10 mb-2">
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-semibold">Tip:</span> Usa el botón
              &quot;Insertar enlace a encabezado&quot; para crear enlaces entre
              secciones.
            </p>
          </div>
          <Textarea
            value={newAgent.documentation || ""}
            onChange={(e) =>
              setNewAgent({ ...newAgent, documentation: e.target.value })
            }
            placeholder={t("settings.documentationPlaceholder")}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
      ) : (
        <div
          className="border rounded-md p-4 bg-muted/30 min-h-[300px] overflow-auto"
          ref={documentationRef}
        >
          <MarkdownRenderer
            content={newAgent.documentation || ""}
            containerRef={documentationRef as React.RefObject<HTMLDivElement>}
            onLinkClick={handleInternalLinkClick}
            onHeadingsFound={setDocumentationHeadings}
          />
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p>{t("settings.documentationHelp")}</p>
        <p className="mt-1">{t("settings.crossReferenceHelp")}</p>
        <div className="mt-2 p-2 border rounded-md bg-blue-50 dark:bg-blue-950">
          <p className="font-medium text-blue-700 dark:text-blue-300">
            Guía para crear enlaces entre secciones:
          </p>
          <ol className="list-decimal ml-5 mt-1 text-blue-600 dark:text-blue-400">
            <li>Edita la sección donde quieres añadir el enlace</li>
            <li>
              Haz clic en el botón &quot;Insertar enlace a encabezado&quot;
            </li>
            <li>Selecciona el encabezado de destino (de cualquier sección)</li>
            <li>Personaliza el texto del enlace si lo deseas</li>
            <li>Haz clic en &quot;Insertar enlace&quot;</li>
          </ol>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-8 bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("settings.createAgent")}</h1>
        {isAdmin && (
          <Badge variant="outline" className="ml-2 gap-1">
            {t("settings.adminOnly")}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.agentSettings")}</CardTitle>
              <CardDescription>
                {t("settings.agentSettingsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="system-instructions">
                    <Settings className="h-4 w-4 mr-2" />
                    {t("settings.systemInstructions")}
                  </TabsTrigger>
                  <TabsTrigger value="documentation">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t("settings.documentation")}
                  </TabsTrigger>
                  <TabsTrigger value="basic-settings">
                    <Bot className="h-4 w-4 mr-2" />
                    {t("settings.basicSettings")}
                  </TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  {activeTab === "system-instructions" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {t("settings.systemInstructions")}
                        </h3>
                        <div className="flex space-x-2">
                          {isEditingInstructions ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditingInstructions(false)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              {t("settings.done")}
                            </Button>
                          ) : (
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyInstructions}
                              >
                                {isCopied ? (
                                  <Check className="h-4 w-4 mr-2" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-2" />
                                )}
                                {isCopied
                                  ? t("settings.copied")
                                  : t("settings.copy")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditingInstructions(true)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {t("settings.edit")}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditingInstructions ? (
                        <div className="space-y-4">
                          <div className="bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded-md p-4 mb-4">
                            <h4 className="text-blue-800 dark:text-blue-200 font-bold text-base mb-2 flex items-center">
                              <Link className="h-5 w-5 mr-2" />
                              Crea enlaces a la documentación desde aquí
                            </h4>
                            <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                              Desde las instrucciones del sistema puedes crear
                              enlaces a cualquier sección de la documentación:
                            </p>
                            <ol className="list-decimal ml-5 text-blue-700 dark:text-blue-300 text-sm">
                              <li className="mb-1">
                                Escribe el texto que quieres que sea el enlace
                              </li>
                              <li className="mb-1">
                                Selecciónalo con el cursor
                              </li>
                              <li className="mb-1">
                                Haz clic en el botón{" "}
                                <span className="font-bold">
                                  &quot;Insertar enlace a encabezado&quot;
                                </span>{" "}
                                abajo
                              </li>
                              <li className="mb-1">
                                Selecciona el encabezado de destino en la
                                documentación
                              </li>
                            </ol>
                          </div>
                          <div className="flex justify-end mb-2">
                            <HeadingSelector
                              instructionsHeadings={instructionsHeadings}
                              documentationHeadings={documentationHeadings}
                              onInsertLink={(markdown) => {
                                const textarea =
                                  document.activeElement as HTMLTextAreaElement;
                                if (
                                  textarea &&
                                  textarea.tagName.toLowerCase() === "textarea"
                                ) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const value = textarea.value;
                                  const newValue =
                                    value.substring(0, start) +
                                    markdown +
                                    value.substring(end);
                                  setNewAgent({
                                    ...newAgent,
                                    system_instructions: newValue,
                                  });
                                  // Establecer el cursor después del enlace insertado
                                  setTimeout(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(
                                      start + markdown.length,
                                      start + markdown.length
                                    );
                                  }, 0);
                                } else {
                                  // Si no hay un textarea activo, simplemente añadir al final
                                  setNewAgent({
                                    ...newAgent,
                                    system_instructions:
                                      (newAgent.system_instructions || "") +
                                      "\n" +
                                      markdown,
                                  });
                                }
                              }}
                            />
                          </div>
                          <Textarea
                            value={newAgent.system_instructions || ""}
                            onChange={(e) =>
                              setNewAgent({
                                ...newAgent,
                                system_instructions: e.target.value,
                              })
                            }
                            placeholder={t(
                              "settings.systemInstructionsPlaceholder"
                            )}
                            className="min-h-[300px] font-mono text-sm"
                          />
                        </div>
                      ) : (
                        <div
                          className="border rounded-md p-4 bg-muted/30 min-h-[300px] overflow-auto"
                          ref={instructionsRef}
                        >
                          <MarkdownRenderer
                            content={newAgent.system_instructions || ""}
                            containerRef={
                              instructionsRef as React.RefObject<HTMLDivElement>
                            }
                            onLinkClick={handleInternalLinkClick}
                            onHeadingsFound={setInstructionsHeadings}
                          />
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <p>{t("settings.systemInstructionsHelp")}</p>
                        <p className="mt-1">
                          {t("settings.crossReferenceHelp")}
                        </p>
                        <div className="mt-2 p-2 border rounded-md bg-blue-50 dark:bg-blue-950">
                          <p className="font-medium text-blue-700 dark:text-blue-300">
                            Guía para crear enlaces entre secciones:
                          </p>
                          <ol className="list-decimal ml-5 mt-1 text-blue-600 dark:text-blue-400">
                            <li>
                              Edita la sección donde quieres añadir el enlace
                            </li>
                            <li>
                              Haz clic en el botón &quot;Insertar enlace a
                              encabezado&quot;
                            </li>
                            <li>
                              Selecciona el encabezado de destino (de cualquier
                              sección)
                            </li>
                            <li>
                              Personaliza el texto del enlace si lo deseas
                            </li>
                            <li>Haz clic en &quot;Insertar enlace&quot;</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "documentation" && renderDocumentation()}

                  {activeTab === "basic-settings" && renderBasicSettings()}
                </div>
              </Tabs>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                {t("settings.lastUpdated")}: {new Date().toLocaleString()}
              </p>
            </CardFooter>
          </Card>

          {showMoreSettings && renderMoreSettings()}
          <div className="flex justify-between pt-6 mt-6 border-t">
            <Button variant="outline" onClick={() => router.back()}>
              {t("settings.cancel")}
            </Button>
            <Button
              onClick={handleCreateAgent}
              disabled={!newAgent.name || isSubmitting}
              className="min-w-[150px]"
            >
              {isSubmitting ? "Creando..." : t("settings.createAgent")}
            </Button>
          </div>
        </div>
        <div className="hidden border rounded-lg lg:block h-[calc(100vh-200px)] sticky top-8">
          <AgentChatPreview agent={newAgent} />
        </div>
      </div>
    </div>
  );
}
