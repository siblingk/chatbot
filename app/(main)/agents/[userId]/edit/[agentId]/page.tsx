"use client";
import { useEffect, useState } from "react";
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
    system_instructions: `🔹 **Personalización de la Primera Interacción**  
- Si el lead proviene de un **Ad específico**, preguntar directamente por **Año, Marca, Modelo y Problema del Vehículo**.  
  - Ejemplo de mensaje:  
    _"Hi there! Welcome to Siblignk! 🚗💡_  
    _To get started with your estimate, can you provide your vehicle's year, make, model, and the issue you're experiencing?"_  
🔗 Configuración asociada: **Welcome Message** y **Lead Qualification Strategy (Smart Targeting)**  
- Si no se especifica el servicio en el Ad, mostrar la opción general.  

🔹 **Flujo del AI para Pre-Quote y Agendamiento**  
1️⃣ **Captura de Datos del Vehículo**  
   - **Datos requeridos antes de generar la Pre-Quote:**  
     ✅ **Año**  
     ✅ **Marca**  
     ✅ **Modelo**  
     ✅ **Problema o Síntoma**  
   🔗 Configuración asociada: **Lead Qualification Strategy (Smart Targeting)**  

2️⃣ **Generación de la Pre-Quote**  
   - **Fuente de Precios:**  
     - **Si el taller tiene precios en Dcitelly:** Usar esos precios como base.  
     - **Si no hay precios en Dcitelly:** Usar **AI-Recommended Prices** basados en tendencias del mercado.  
   🔗 **Configuración asociada: Fuente de Precios (Dcitelly o AI-Recommended Prices)**  

3️⃣ **Motivación para Convertir el Lead en una Cita**  
   - Explicar al usuario por qué elegir Siblignk (**confianza, rapidez, descuento**).  
   - Ofrecer el incentivo del **10% OFF en mano de obra**.  
   🔗 **Configuración asociada: Pre-Quote Message - Special Offer (10% OFF Labor)**  

4️⃣ **Agendamiento de la Cita con un Taller Cercano**  
   - Capturar información del usuario (**email y ZIP code**).  
   - Buscar talleres cercanos en base a **Google Maps o Dcitelly**.  
   - Asignar automáticamente al taller más cercano o permitir que el usuario elija.  
   🔗 **Configuración asociada: Workflow Automation - Auto-Assign Leads (ON)**  

5️⃣ **Seguimiento y Recordatorio**  
   - Enviar recordatorios si el lead no agenda en **3 horas** y **24 horas**.  
   - Priorización de talleres con **mejores calificaciones en Google Maps**.  
   🔗 **Configuración asociada: Workflow Automation - AI Auto-Response (ON) + Lead Qualification Strategy (Smart Targeting)**

🔹 **Auto-Assign Leads: ON**
📌 **Cómo funciona:**
1️⃣ Al capturar un nuevo lead, Siblignk ejecuta automáticamente una búsqueda en Google Maps para encontrar 5-10 talleres cercanos a la ubicación del lead (ZIP code).
2️⃣ El sistema analizará cada taller en base a:
⭐ Calificación promedio (estrellas) en Google Maps.
📝 Comentarios recientes (últimos 3-5 comentarios).
🚨 Último comentario negativo (fecha y descripción).
📌 Ubicación exacta y distancia desde el lead.
📞 Información de contacto disponible (teléfono, sitio web, dirección).
3️⃣ Se generará un documento adjunto con la información analizada y se adjuntará al chat del lead como referencia.
✅ **Visualización en el chat:**
Cada taller detectado aparecerá como un nuevo chat en la interfaz del sistema.
Formato del chat:
Nombre del taller + Nombre del lead (Ejemplo: "Joe's Auto Repair - Maria Lopez").
Documento adjunto con la información detallada del taller.
Datos clave visibles en el preview del chat.
✅ **Flujo de asignación de taller:**
El sistema priorizará los talleres según:
📍 Proximidad (más cercano al ZIP del lead).
⭐ Mejor calificación general en Google Maps.
💲 Mejor precio registrado en Dcitelly (si disponible).
🚨 Menos comentarios negativos recientes.
Si hay más de un taller disponible, ofrecer una lista para que el usuario elija.
📌 **Próximo paso en la automatización:**
Más adelante, se integrará un sistema de llamadas automáticas con IA para contactar a los talleres y confirmar disponibilidad en tiempo real.

🔹 **AI Auto-Response: ON**
📌 **Cómo funciona:**
- Si el usuario no responde en 3 minutos, enviar un recordatorio en el chat.
- Si el usuario no agenda en 3 horas, enviar recordatorio automático.
- Si el usuario no agenda en 24 horas, enviar oferta final de descuento.
- Responde automáticamente a preguntas antes de avanzar a la pre-quote.
📌 **Mensajes Automáticos Configurados:**
📌 **Recordatorio de 3 horas:**  
_"Just checking in! We still have availability for your repair. Would you like to book your appointment now? 🚗💡"_

📌 **Recordatorio de 24 horas:**  
_"Limited-time offer! Schedule your appointment today and keep your 10% OFF labor discount!"_`,
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
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("system-instructions");

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
    if (user && !isAdmin && user.id !== params.userId) {
      router.push("/");
    }
  }, [params.userId, user, isAdmin, router]);

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

  const renderSystemInstructions = (content: string) => {
    // Reemplazar todos los enlaces que tienen 🔗
    const processedContent = content.replace(
      /🔗\s*(.*?)(?=\n|$)/g,
      (match, p1) => {
        // Mapeo de textos a IDs de sección
        const sectionMap: { [key: string]: string } = {
          "Configuración asociada: **Welcome Message**": "welcome-message",
          "Configuración asociada: **Welcome Message** y **Lead Qualification Strategy (Smart Targeting)**":
            "welcome-message",
          "Configuración asociada: **Lead Qualification Strategy (Smart Targeting)**":
            "lead-strategy",
          "**Configuración asociada: Fuente de Precios (Dcitelly o AI-Recommended Prices)**":
            "pricing",
          "**Configuración asociada: Pre-Quote Message - Special Offer (10% OFF Labor)**":
            "special-offer",
          "**Configuración asociada: Workflow Automation - Auto-Assign Leads (ON)**":
            "auto-assign",
          "**Configuración asociada: Workflow Automation - AI Auto-Response (ON)**":
            "auto-respond",
          "**Configuración asociada: Workflow Automation - AI Auto-Response (ON) + Lead Qualification Strategy (Smart Targeting)**":
            "auto-respond",
        };

        // Buscar la mejor coincidencia en el mapa de secciones
        let sectionId = "";
        for (const [key, value] of Object.entries(sectionMap)) {
          if (p1.includes(key) || key.includes(p1)) {
            sectionId = value;
            break;
          }
        }

        // Si no se encontró una coincidencia exacta, intentar coincidencia parcial
        if (!sectionId) {
          if (p1.toLowerCase().includes("welcome"))
            sectionId = "welcome-message";
          else if (p1.toLowerCase().includes("lead"))
            sectionId = "lead-strategy";
          else if (p1.toLowerCase().includes("price")) sectionId = "pricing";
          else if (p1.toLowerCase().includes("offer"))
            sectionId = "special-offer";
          else if (p1.toLowerCase().includes("assign"))
            sectionId = "auto-assign";
          else if (p1.toLowerCase().includes("response"))
            sectionId = "auto-respond";
        }

        return `[🔗 ${p1}](#${sectionId})`;
      }
    );

    // Manejador de clics para los enlaces
    const handleLinkClick = (e: React.MouseEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link) {
        e.preventDefault();
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          const sectionId = href.substring(1);
          setActiveTab("documentation");
          setTimeout(() => {
            const section = document.getElementById(sectionId);
            if (section) {
              section.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        }
      }
    };

    return (
      <div onClick={handleLinkClick}>
        <MarkdownRenderer content={processedContent} />
      </div>
    );
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Configuration Guide</CardTitle>
                <CardDescription>
                  Comprehensive documentation of the AI agent&apos;s
                  capabilities, settings, and best practices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div id="welcome-message" className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Welcome Message Configuration
                  </h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      The welcome message serves as the crucial first point of
                      contact with users. Configure it to establish trust and
                      gather essential information efficiently.
                    </p>
                    <div className="pl-4 space-y-4">
                      <div>
                        <h4 className="font-medium">Standard Bot Chat:</h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Pre-optimized template designed for maximum lead
                            conversion
                          </li>
                          <li>
                            Structured to collect vehicle information
                            systematically:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Year of the vehicle</li>
                              <li>Make and model</li>
                              <li>Specific issue or symptoms</li>
                            </ul>
                          </li>
                          <li>
                            Includes trust-building elements:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Professional greeting</li>
                              <li>Service expertise highlights</li>
                              <li>Clear value proposition</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">
                          Custom Message Configuration:
                        </h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Full Markdown support for rich formatting:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Bold and italic text for emphasis</li>
                              <li>
                                Bullet points for clear information structure
                              </li>
                              <li>Headers for content organization</li>
                            </ul>
                          </li>
                          <li>
                            Dynamic content capabilities:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Custom variables for personalization</li>
                              <li>
                                Conditional messaging based on user source
                              </li>
                              <li>Multi-language support</li>
                            </ul>
                          </li>
                          <li>
                            Best practices for engagement:
                            <ul className="list-disc pl-6 mt-1">
                              <li>
                                Keep messages concise (2-3 paragraphs max)
                              </li>
                              <li>Use emojis strategically for warmth</li>
                              <li>Include clear call-to-action</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="lead-strategy" className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Lead Qualification Strategy
                  </h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Choose between two sophisticated lead qualification
                      approaches, each designed for specific business needs and
                      customer interactions.
                    </p>
                    <div className="pl-4 space-y-6">
                      <div>
                        <h4 className="font-medium">
                          Smart Targeting Strategy:
                        </h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Adaptive Information Gathering:
                            <ul className="list-disc pl-6 mt-1">
                              <li>
                                Progressive profiling based on user responses
                              </li>
                              <li>Dynamic question sequencing</li>
                              <li>Context-aware follow-up questions</li>
                            </ul>
                          </li>
                          <li>
                            Intelligent Lead Scoring:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Multi-factor evaluation system</li>
                              <li>Behavioral analysis</li>
                              <li>Purchase intent indicators</li>
                            </ul>
                          </li>
                          <li>
                            Conversion Optimization:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Personalized engagement paths</li>
                              <li>Timing-based interventions</li>
                              <li>Custom offer triggers</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">
                          Strict Filtering Strategy:
                        </h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Mandatory Information Requirements:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Complete vehicle specifications</li>
                              <li>Verified contact information</li>
                              <li>Service history documentation</li>
                            </ul>
                          </li>
                          <li>
                            Quality Control Measures:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Data validation checks</li>
                              <li>Duplicate lead detection</li>
                              <li>Fraud prevention filters</li>
                            </ul>
                          </li>
                          <li>
                            Business Rules Engine:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Custom qualification criteria</li>
                              <li>Industry-specific requirements</li>
                              <li>Compliance checkpoints</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="pricing" className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Pricing Sources Configuration
                  </h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Configure how the AI generates and presents pricing
                      information using multiple data sources and intelligent
                      pricing strategies.
                    </p>
                    <div className="pl-4 space-y-6">
                      <div>
                        <h4 className="font-medium">Dcitelly Integration:</h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Real-time Price Synchronization:
                            <ul className="list-disc pl-6 mt-1">
                              <li>
                                Direct integration with shop management system
                              </li>
                              <li>Automatic price updates</li>
                              <li>Inventory-aware pricing</li>
                            </ul>
                          </li>
                          <li>
                            Service-specific Pricing:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Labor rate calculations</li>
                              <li>Parts pricing integration</li>
                              <li>Package deal configuration</li>
                            </ul>
                          </li>
                          <li>
                            Dynamic Pricing Rules:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Volume discounts</li>
                              <li>Seasonal adjustments</li>
                              <li>Loyalty program integration</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">AI-Recommended Pricing:</h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Market Analysis Engine:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Competitive price monitoring</li>
                              <li>Regional market trends</li>
                              <li>Demand-based pricing</li>
                            </ul>
                          </li>
                          <li>
                            Smart Price Optimization:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Service complexity factors</li>
                              <li>Customer segment analysis</li>
                              <li>Profit margin optimization</li>
                            </ul>
                          </li>
                          <li>
                            Price Presentation Strategies:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Range-based estimates</li>
                              <li>Tiered pricing options</li>
                              <li>Value proposition highlighting</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="special-offer" className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Special Offers Configuration
                  </h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Design and implement strategic promotional offers to drive
                      conversions and customer engagement.
                    </p>
                    <div className="pl-4 space-y-4">
                      <div>
                        <h4 className="font-medium">
                          Offer Types and Structure:
                        </h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Standard Discount Options:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Percentage-based discounts</li>
                              <li>Fixed amount deductions</li>
                              <li>Service package bundles</li>
                            </ul>
                          </li>
                          <li>
                            Time-Sensitive Promotions:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Limited-time offers</li>
                              <li>Flash sale configurations</li>
                              <li>Seasonal promotion templates</li>
                            </ul>
                          </li>
                          <li>
                            Customer-Specific Offers:
                            <ul className="list-disc pl-6 mt-1">
                              <li>First-time customer specials</li>
                              <li>Loyalty program rewards</li>
                              <li>Referral incentives</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">
                          Offer Management System:
                        </h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Automation Features:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Scheduled offer activation</li>
                              <li>Dynamic pricing adjustments</li>
                              <li>Inventory-linked promotions</li>
                            </ul>
                          </li>
                          <li>
                            Tracking and Analytics:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Offer performance metrics</li>
                              <li>Conversion rate analysis</li>
                              <li>ROI calculations</li>
                            </ul>
                          </li>
                          <li>
                            Integration Capabilities:
                            <ul className="list-disc pl-6 mt-1">
                              <li>CRM system synchronization</li>
                              <li>Booking system integration</li>
                              <li>Payment gateway compatibility</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="auto-assign" className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Auto-Assign Leads System
                  </h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Advanced lead distribution system that automatically
                      matches customers with the most suitable service
                      providers.
                    </p>
                    <div className="pl-4 space-y-6">
                      <div>
                        <h4 className="font-medium">
                          Assignment Criteria Engine:
                        </h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Location-Based Matching:
                            <ul className="list-disc pl-6 mt-1">
                              <li>ZIP code proximity analysis</li>
                              <li>Service area mapping</li>
                              <li>Travel time calculations</li>
                            </ul>
                          </li>
                          <li>
                            Shop Quality Metrics:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Google Maps ratings integration</li>
                              <li>Review sentiment analysis</li>
                              <li>Historical performance data</li>
                            </ul>
                          </li>
                          <li>
                            Capacity Management:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Real-time availability tracking</li>
                              <li>Workload distribution</li>
                              <li>Specialty service matching</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">
                          Assignment Process Flow:
                        </h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Initial Assessment:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Service type categorization</li>
                              <li>Urgency level evaluation</li>
                              <li>Customer preferences analysis</li>
                            </ul>
                          </li>
                          <li>
                            Shop Selection Algorithm:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Multi-factor scoring system</li>
                              <li>Weighted criteria evaluation</li>
                              <li>Dynamic ranking adjustments</li>
                            </ul>
                          </li>
                          <li>
                            Assignment Confirmation:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Automated notifications</li>
                              <li>Shop acceptance tracking</li>
                              <li>Customer confirmation system</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="auto-respond" className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    AI Auto-Response System
                  </h3>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Intelligent automated response system that maintains
                      engagement and drives conversions through timely
                      interactions.
                    </p>
                    <div className="pl-4 space-y-6">
                      <div>
                        <h4 className="font-medium">
                          Response Trigger System:
                        </h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Time-Based Triggers:
                            <ul className="list-disc pl-6 mt-1">
                              <li>3-minute inactivity follow-up</li>
                              <li>3-hour booking reminder</li>
                              <li>24-hour final offer</li>
                            </ul>
                          </li>
                          <li>
                            Behavior-Based Triggers:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Cart abandonment recovery</li>
                              <li>Quote review prompts</li>
                              <li>Service inquiry follow-ups</li>
                            </ul>
                          </li>
                          <li>
                            Context-Aware Responses:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Customer intent detection</li>
                              <li>Conversation stage awareness</li>
                              <li>Service type customization</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium">Response Management:</h4>
                        <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                          <li>
                            Message Customization:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Dynamic content insertion</li>
                              <li>Personalization tokens</li>
                              <li>Multi-language support</li>
                            </ul>
                          </li>
                          <li>
                            Response Analytics:
                            <ul className="list-disc pl-6 mt-1">
                              <li>Engagement tracking</li>
                              <li>Response rate analysis</li>
                              <li>Conversion attribution</li>
                            </ul>
                          </li>
                          <li>
                            System Integration:
                            <ul className="list-disc pl-6 mt-1">
                              <li>CRM data synchronization</li>
                              <li>Booking system connection</li>
                              <li>Communication channel integration</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
