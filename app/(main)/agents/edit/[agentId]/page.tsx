"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUserRole } from "@/hooks/useUserRole";
import { getAgentById, updateAgent, deleteAgent } from "@/app/actions/agents";
import { Agent } from "@/types/agents";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Bot,
  Clock,
  MessageSquare,
  Shield,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  Copy,
  Edit,
  Check,
  FileText,
  Store,
} from "lucide-react";
import AgentChatPreview from "@/components/chat/agent-chat-preview";
import { PreviewUrlGenerator } from "@/components/settings/preview-url-generator";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const t = useTranslations();

  // Inicializar con un agente por defecto para evitar estados de carga
  const [agent, setAgent] = useState<Agent>({
    id: params.agentId as string,
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
- **Configuración asociada: Workflow Automation - AI Auto-Response (ON) + Lead Qualification Strategy (Smart Targeting)**

## Auto-Assign Leads: ON
**Cómo funciona:**
1. Al capturar un nuevo lead, Siblignk ejecuta automáticamente una búsqueda en Google Maps para encontrar 5-10 talleres cercanos a la ubicación del lead (ZIP code).
2. El sistema analizará cada taller en base a:
⭐ Calificación promedio (estrellas) en Google Maps.
📝 Comentarios recientes (últimos 3-5 comentarios).
🚨 Último comentario negativo (fecha y descripción).
📌 Ubicación exacta y distancia desde el lead.
📞 Información de contacto disponible (teléfono, sitio web, dirección).
3. Se generará un documento adjunto con la información analizada y se adjuntará al chat del lead como referencia.

## AI Auto-Response: ON
**Cómo funciona:**
- Si el usuario no responde en 3 minutos, enviar un recordatorio en el chat.
- Si el usuario no agenda en 3 horas, enviar recordatorio automático.
- Si el usuario no agenda en 24 horas, enviar oferta final de descuento.
- Responde automáticamente a preguntas antes de avanzar a la pre-quote.
- Ver [mensajes automáticos](#mensajes-automaticos) en la documentación.`,
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

Para más detalles, consulta las [instrucciones sobre Auto-Assign Leads](#auto-assign-leads-on).

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
    target_agent_id: undefined,
    user_id: user?.id || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [isEditingDocumentation, setIsEditingDocumentation] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("system-instructions");

  // Referencias para los contenedores de markdown
  const instructionsRef = useRef<HTMLDivElement>(null);
  const documentationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      if (!user) return;

      try {
        // Obtener el agente sin mostrar estado de carga
        const currentAgent = await getAgentById(params.agentId as string, true);

        if (currentAgent) {
          setAgent(currentAgent);
        } else {
          // Intentar obtener el agente directamente desde la API
          try {
            const response = await fetch(`/api/agents/${params.agentId}`);
            if (response.ok) {
              const directAgent = await response.json();
              if (directAgent && directAgent.id) {
                setAgent(directAgent);
              } else {
                toast.error(t("settings.agentNotFound"));
              }
            }
          } catch (directError) {
            console.error("Error al obtener el agente desde API:", directError);
            toast.error(t("settings.errorLoading"));
          }
        }
      } catch (err) {
        console.error("Error al cargar el agente:", err);
        toast.error(t("settings.errorLoading"));
      }
    };

    fetchAgent();
  }, [params.agentId, t, user, isAdmin]);

  // Verificar si el usuario es administrador o si está accediendo a su propio agente
  useEffect(() => {
    // Solo redirigir si el usuario no es administrador y no es el propietario del agente
    // Y asegurarse de que el usuario esté autenticado antes de hacer la verificación
    if (
      user &&
      !isAdmin &&
      agent &&
      agent.user_id &&
      user.id !== agent.user_id
    ) {
      router.push("/agents");
    }
  }, [user, isAdmin, agent, router]);

  const handleUpdateAgent = async () => {
    try {
      if (!agent.name) {
        toast.error(t("settings.errorUpdatingAgent"));
        return;
      }

      setIsSubmitting(true);
      await updateAgent(agent);
      toast.success(t("settings.agentUpdated"));
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error(t("settings.errorUpdatingAgent"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgent = async () => {
    try {
      if (!agent?.id) {
        toast.error(t("settings.errorDeletingAgent"));
        return;
      }

      setIsSubmitting(true);
      await deleteAgent(agent.id);
      setIsDeleteDialogOpen(false);
      toast.success(t("settings.agentDeleted"));
      router.push(`/agents/${params.userId}`);
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error(t("settings.errorDeletingAgent"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInstructions = () => {
    if (agent.system_instructions) {
      navigator.clipboard.writeText(agent.system_instructions);
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

  const renderSystemInstructions = (content: string) => (
    <div className="space-y-4 pt-4">
      <div
        className="bg-muted/30 min-h-[300px] overflow-auto"
        ref={instructionsRef}
      >
        <MarkdownRenderer
          content={content}
          containerRef={instructionsRef as React.RefObject<HTMLDivElement>}
          onLinkClick={handleInternalLinkClick}
        />
      </div>
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
              onClick={async () => {
                setIsEditingDocumentation(false);
                // Guardar los cambios en la documentación
                try {
                  setIsSubmitting(true);
                  await updateAgent({
                    id: agent.id,
                    documentation: agent.documentation,
                  });
                  toast.success(t("settings.agentUpdated"));
                } catch (error) {
                  console.error("Error updating documentation:", error);
                  toast.error(t("settings.errorUpdatingAgent"));
                } finally {
                  setIsSubmitting(false);
                }
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
          <Textarea
            value={agent.documentation || ""}
            onChange={(e) =>
              setAgent({ ...agent, documentation: e.target.value })
            }
            placeholder={t("settings.documentationPlaceholder")}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
      ) : (
        <div
          className="border rounded-md p-4 bg-sidebar min-h-[300px] overflow-auto shadow-sm"
          ref={documentationRef}
        >
          {agent.documentation ? (
            <MarkdownRenderer
              content={agent.documentation || ""}
              containerRef={documentationRef as React.RefObject<HTMLDivElement>}
              onLinkClick={handleInternalLinkClick}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="h-12 w-12 mb-2 opacity-20" />
              <p>{t("settings.noDocumentation")}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setIsEditingDocumentation(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t("settings.edit")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

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
            value={agent.name}
            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
            placeholder={t("settings.enterAgentNamePlaceholder")}
            className="w-full"
          />
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
                <Textarea
                  placeholder={t("settings.systemInstructionsPlaceholder")}
                  value={agent.system_instructions}
                  onChange={(e) =>
                    setAgent({ ...agent, system_instructions: e.target.value })
                  }
                  className="min-h-[250px] font-mono text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsEditingInstructions(false)}
                    className="ml-2"
                  >
                    {t("settings.done")}
                  </Button>
                </div>
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
                  {agent.system_instructions ? (
                    <div className="mt-6">
                      {renderSystemInstructions(agent.system_instructions)}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
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
                agent.lead_strategy === "Strict-Filtering"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setAgent({
                  ...agent,
                  lead_strategy: "Strict-Filtering" as Agent["lead_strategy"],
                })
              }
              className="flex-1"
            >
              {t("settings.strictFiltering")}
            </Button>
            <Button
              variant={
                agent.lead_strategy === "Smart-Targeting"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setAgent({
                  ...agent,
                  lead_strategy: "Smart-Targeting" as Agent["lead_strategy"],
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
            {t("settings.agentWelcomeMessage")}
          </CardTitle>
          <CardDescription>
            {t("settings.agentWelcomeMessageDescription")}
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
            value={agent.welcome_message}
            onChange={(e) => {
              const newMessage = e.target.value;
              setAgent({ ...agent, welcome_message: newMessage });
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
            {t("settings.agentPreQuoteMessageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t("settings.preQuoteMessagePlaceholder")}
            value={agent.pre_quote_message}
            onChange={(e) =>
              setAgent({ ...agent, pre_quote_message: e.target.value })
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
                variant={agent.expiration_time === time ? "default" : "outline"}
                onClick={() =>
                  setAgent({
                    ...agent,
                    expiration_time: time as Agent["expiration_time"],
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
                checked={agent.auto_assign_leads}
                onCheckedChange={(checked) =>
                  setAgent({ ...agent, auto_assign_leads: checked })
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
                checked={agent.auto_respond}
                onCheckedChange={(checked) =>
                  setAgent({ ...agent, auto_respond: checked })
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
        </CardHeader>
        <CardContent>
          <Select
            value={agent.visibility}
            onValueChange={(value: "private" | "public") =>
              setAgent({ ...agent, visibility: value })
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8 bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {t("settings.edit")} {agent.name}
          </h1>
          {isAdmin && (
            <Badge variant="outline" className="ml-2 gap-1">
              {t("settings.adminOnly")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              // Actualizar el modelo según la pestaña
              if (value === "system-instructions") {
                setAgent((prev) => ({ ...prev, model: "quote-builder-ai" }));
              } else if (value === "omni-shop") {
                setAgent((prev) => ({ ...prev, model: "omni-ai" }));
              }
            }}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger
                value="chat-preview"
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                Chat Preview
              </TabsTrigger>
              <TabsTrigger
                value="system-instructions"
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                System Instructions
              </TabsTrigger>
              <TabsTrigger
                value="documentation"
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Documentation
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="omni-shop"
                className="flex items-center gap-1"
              >
                <Store className="h-4 w-4" />
                OMNI V1 (SHOP DISPLAY)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="chat-preview" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Chat Preview</CardTitle>
              <CardDescription>
                Preview how your agent will interact with users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <AgentChatPreview agent={agent} />
                  </div>
                  <div className="mt-4">
                    <PreviewUrlGenerator
                      agentId={agent?.id}
                      agentConfig={agent}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-instructions" className="mt-0">
          <div className="space-y-6">
            {renderBasicSettings()}
            {showMoreSettings && renderMoreSettings()}
            <div className="flex justify-between pt-6 mt-6 border-t">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  {t("settings.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isSubmitting}
                  className="flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("settings.delete")}
                </Button>
              </div>
              <Button
                onClick={handleUpdateAgent}
                disabled={!agent.name || isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? "Guardando..." : t("settings.saveChanges")}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documentation" className="mt-0">
          {renderDocumentation()}
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced settings for this agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {/* Aquí puedes agregar más configuraciones avanzadas */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="omni-shop" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>OMNI V1 (SHOP DISPLAY)</CardTitle>
              <CardDescription>
                Configure how this agent appears in shop displays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Shop display configuration will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para confirmar eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.deleteAgent")}</DialogTitle>
            <DialogDescription>
              {t("settings.deleteAgentConfirmation", {
                name: agent.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("settings.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAgent}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Eliminando..." : t("settings.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
