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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Bot,
  Clock,
  MessageSquare,
  Shield,
  Sparkles,
  Trash2,
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

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const t = useTranslations();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      try {
        console.log("=== INICIO fetchAgent en EditAgentPage ===");
        console.log("Intentando obtener agente con ID:", params.agentId);
        console.log("Usuario es admin:", isAdmin);
        console.log("Usuario ID:", user?.id);

        // Usar getAgentById para todos los usuarios
        // El parámetro true indica que se debe ignorar el estado de activación
        console.log("Llamando a getAgentById con ignoreActiveStatus=true");
        const currentAgent = await getAgentById(params.agentId as string, true);

        console.log(
          "Respuesta de getAgentById:",
          currentAgent ? "Agente encontrado" : "Agente no encontrado"
        );

        if (!currentAgent) {
          console.error(
            "No se pudo encontrar el agente con ID:",
            params.agentId
          );

          // Si no se encuentra el agente, intentar una solución alternativa
          console.log("Intentando solución alternativa con API...");

          // Intentar obtener el agente directamente desde la API
          try {
            const response = await fetch(`/api/agents/${params.agentId}`);
            if (response.ok) {
              const directAgent = await response.json();

              if (directAgent && directAgent.id) {
                console.log(
                  "Agente obtenido directamente desde API:",
                  directAgent
                );
                setAgent(directAgent);
                setLoading(false);
                return;
              }
            } else {
              console.log("API respondió con error:", response.status);
              const errorData = await response.json();
              console.log("Detalles del error:", errorData);
            }
          } catch (directError) {
            console.error("Error al obtener el agente desde API:", directError);
          }

          setError(t("settings.agentNotFound"));
          setLoading(false);
          return;
        }

        console.log("Agente encontrado:", currentAgent);
        setAgent(currentAgent);
      } catch (err) {
        console.error("Error al cargar el agente:", err);
        setError(t("settings.errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAgent();
    }
  }, [params.agentId, t, user, isAdmin]);

  // Verificar si el usuario es administrador o si está accediendo a su propio agente
  useEffect(() => {
    if (!isAdmin && user?.id !== params.userId) {
      router.push("/");
    }
  }, [params.userId, user, isAdmin, router]);

  const handleUpdateAgent = async () => {
    try {
      if (!agent) return;

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

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6 bg-card p-4 rounded-lg shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("settings.editAgent")}</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6 bg-card p-4 rounded-lg shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("settings.editAgent")}</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">
              {error || t("settings.agentNotFound")}
            </p>
            <Button onClick={() => router.back()}>
              {t("settings.goBack")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderAgentForm = () => (
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
            <Sparkles className="h-5 w-5 text-primary" />
            {t("settings.selectAIAgent")}
          </CardTitle>
          <CardDescription>{t("settings.chooseAIType")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={
                agent.model === "quote-builder-ai" ? "default" : "outline"
              }
              onClick={() => setAgent({ ...agent, model: "quote-builder-ai" })}
              className="flex-1"
            >
              {t("settings.quoteBuilderAI")}
            </Button>
            <Button
              variant={agent.model === "omni-ai" ? "default" : "outline"}
              onClick={() => setAgent({ ...agent, model: "omni-ai" })}
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
                    agent.personality_tone === tone ? "default" : "outline"
                  }
                  onClick={() =>
                    setAgent({
                      ...agent,
                      personality_tone: tone as Agent["personality_tone"],
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("settings.welcomeMessage")}
          </CardTitle>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("settings.preQuoteMessage")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              "Standard",
              "With Warranty",
              "Detailed Explanation",
              "Special Offer",
              "Custom",
            ].map((type) => (
              <Button
                key={type}
                variant={agent.pre_quote_type === type ? "default" : "outline"}
                onClick={() =>
                  setAgent({
                    ...agent,
                    pre_quote_type: type as Agent["pre_quote_type"],
                  })
                }
                className="flex-1 min-w-[120px]"
              >
                {type}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder={t("settings.preQuoteMessagePlaceholder")}
            value={agent.pre_quote_message}
            onChange={(e) =>
              setAgent({ ...agent, pre_quote_message: e.target.value })
            }
            className="min-h-[100px]"
          />
        </CardContent>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {t("settings.systemInstructions")}
          </CardTitle>
          <CardDescription>
            {t("settings.systemInstructionsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t("settings.systemInstructionsPlaceholder")}
            value={agent.system_instructions}
            onChange={(e) =>
              setAgent({ ...agent, system_instructions: e.target.value })
            }
            className="min-h-[150px]"
          />
        </CardContent>
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
                <Label>{t("settings.autoAssignLeads")}</Label>
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
                <Label>{t("settings.aiAutoResponse")}</Label>
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
        <h1 className="text-2xl font-bold">{t("settings.editAgent")}</h1>
        {isAdmin && (
          <Badge variant="outline" className="ml-2 gap-1">
            {t("settings.adminOnly")}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {renderAgentForm()}
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
        <div className="hidden border rounded-lg lg:block h-[calc(100vh-200px)] sticky top-8">
          {agent && <AgentChatPreview agent={agent} />}

          <PreviewUrlGenerator agentId={agent?.id} agentConfig={agent} />
        </div>
      </div>

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
