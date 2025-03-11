"use client";

import { useState } from "react";
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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMoreSettings, setShowMoreSettings] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
                <Textarea
                  placeholder={t("settings.systemInstructionsPlaceholder")}
                  value={newAgent.system_instructions || ""}
                  onChange={(e) =>
                    setNewAgent({
                      ...newAgent,
                      system_instructions: e.target.value,
                    })
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
          {renderBasicSettings()}
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
