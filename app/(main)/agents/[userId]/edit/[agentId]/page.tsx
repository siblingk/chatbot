"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAgents, updateAgent, deleteAgent } from "@/app/actions/agents";
import { Agent } from "@/types/agents";
import { useAuth } from "@/contexts/auth-context";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Bot, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AgentChatPreview from "@/components/chat/agent-chat-preview";
import { PreviewUrlGenerator } from "@/components/settings/preview-url-generator";

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

  useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      try {
        const agentsData = await getAgents();
        const currentAgent = agentsData.find((a) => a.id === params.agentId);

        if (!currentAgent) {
          setError(t("settings.agentNotFound"));
          return;
        }

        setAgent(currentAgent);
        setError(null);
      } catch (err) {
        console.error("Error fetching agent:", err);
        setError(t("settings.errorLoading"));
        toast.error(t("settings.errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    if (params.agentId) {
      fetchAgent();
    }
  }, [params.agentId, t]);

  // Verificar si el usuario es administrador o si está accediendo a su propio agente
  useEffect(() => {
    if (!isAdmin && user?.id !== params.userId) {
      router.push("/");
    }
  }, [params.userId, user, isAdmin, router]);

  const handleUpdateAgent = async () => {
    try {
      if (!agent) return;

      await updateAgent(agent);
      toast.success(t("settings.agentUpdated"));
      router.push(`/agents/${params.userId}`);
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error(t("settings.errorUpdatingAgent"));
    }
  };

  const handleDeleteAgent = async () => {
    try {
      if (!agent?.id) {
        toast.error(t("settings.errorDeletingAgent"));
        return;
      }

      await deleteAgent(agent.id);
      setIsDeleteDialogOpen(false);
      toast.success(t("settings.agentDeleted"));
      router.push(`/agents/${params.userId}`);
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error(t("settings.errorDeletingAgent"));
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center gap-2 mb-6">
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
      </>
    );
  }

  if (error || !agent) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 mb-6">
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
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">
            {error || t("settings.agentNotFound")}
          </p>
          <Button onClick={() => router.back()}>{t("settings.goBack")}</Button>
        </div>
      </div>
    );
  }

  const renderAgentForm = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.agentName")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.enterAgentName")}
        </p>
        <Input
          value={agent.name}
          onChange={(e) => setAgent({ ...agent, name: e.target.value })}
          placeholder={t("settings.enterAgentNamePlaceholder")}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.selectAIAgent")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.chooseAIType")}
        </p>
        <div className="flex gap-2">
          <Button
            variant={agent.model === "quote-builder-ai" ? "default" : "outline"}
            onClick={() => setAgent({ ...agent, model: "quote-builder-ai" })}
          >
            {t("settings.quoteBuilderAI")}
          </Button>
          <Button
            variant={agent.model === "omni-ai" ? "default" : "outline"}
            onClick={() => setAgent({ ...agent, model: "omni-ai" })}
          >
            {t("settings.omniAI")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.aiPersonality")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.customizeAIInteraction")}
        </p>
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
              >
                {tone}
              </Button>
            )
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.leadStrategy")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.determineLeadFiltering")}
        </p>
        <div className="flex gap-2">
          <Button
            variant={
              agent.lead_strategy === "Strict-Filtering" ? "default" : "outline"
            }
            onClick={() =>
              setAgent({
                ...agent,
                lead_strategy: "Strict-Filtering" as Agent["lead_strategy"],
              })
            }
          >
            {t("settings.strictFiltering")}
          </Button>
          <Button
            variant={
              agent.lead_strategy === "Smart-Targeting" ? "default" : "outline"
            }
            onClick={() =>
              setAgent({
                ...agent,
                lead_strategy: "Smart-Targeting" as Agent["lead_strategy"],
              })
            }
          >
            {t("settings.smartTargeting")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.welcomeMessage")}</h3>
        <Tabs defaultValue="standard" className="w-full">
          <TabsList>
            <TabsTrigger value="standard">
              {t("settings.standardBotChat")}
            </TabsTrigger>
            <TabsTrigger value="custom">
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
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.preQuoteMessage")}</h3>
        <div className="flex flex-wrap gap-2">
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
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.expirationTime")}</h3>
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
            >
              {time}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {t("settings.systemInstructions")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.systemInstructionsDescription")}
        </p>
        <Textarea
          placeholder={t("settings.systemInstructionsPlaceholder")}
          value={agent.system_instructions}
          onChange={(e) =>
            setAgent({ ...agent, system_instructions: e.target.value })
          }
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {t("settings.workflowAutomation")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.workflowAutomationDescription")}
        </p>
        <div className="space-y-4">
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
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.visibility")}</h3>
        <Select
          value={agent.visibility}
          onValueChange={(value: "private" | "public") =>
            setAgent({ ...agent, visibility: value })
          }
        >
          <SelectTrigger>
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
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
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
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                {t("settings.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("settings.delete")}
              </Button>
            </div>
            <Button onClick={handleUpdateAgent} disabled={!agent.name}>
              {t("settings.saveChanges")}
            </Button>
          </div>
        </div>
        <div className="hidden lg:block h-[calc(100vh-200px)] sticky top-8">
          <div className="space-y-4">
            {agent && <AgentChatPreview agent={agent} />}
            <PreviewUrlGenerator agentId={agent?.id} agentConfig={agent} />
          </div>
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
            >
              {t("settings.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgent}>
              {t("settings.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
