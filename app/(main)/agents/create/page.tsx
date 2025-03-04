"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateAgent } from "@/app/actions/agents";
import {
  Agent,
  PersonalityTone,
  LeadStrategy,
  PreQuoteType,
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
} from "lucide-react";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import AgentChatPreview from "@/components/chat/agent-chat-preview";

export default function CreateAgentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const t = useTranslations();

  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: "",
    model: "quote-builder-ai",
    visibility: "private",
    personality_tone: "Friendly",
    lead_strategy: "Smart-Targeting",
    welcome_message: "Welcome to AutoFix! How can we assist you today?",
    pre_quote_message: "Your repair estimate is between $x, $y",
    pre_quote_type: "Standard",
    expiration_time: "24 Hours",
    system_instructions: "",
    auto_assign_leads: true,
    auto_respond: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
            value={newAgent.welcome_message || ""}
            onChange={(e) => {
              const newMessage = e.target.value;
              setNewAgent({ ...newAgent, welcome_message: newMessage });
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
                variant={
                  newAgent.pre_quote_type === type ? "default" : "outline"
                }
                onClick={() =>
                  setNewAgent({
                    ...newAgent,
                    pre_quote_type: type as PreQuoteType,
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
            value={newAgent.pre_quote_message || ""}
            onChange={(e) =>
              setNewAgent({ ...newAgent, pre_quote_message: e.target.value })
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
            value={newAgent.system_instructions || ""}
            onChange={(e) =>
              setNewAgent({ ...newAgent, system_instructions: e.target.value })
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
                checked={newAgent.auto_assign_leads}
                onCheckedChange={(checked) =>
                  setNewAgent({ ...newAgent, auto_assign_leads: checked })
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
                checked={newAgent.auto_respond}
                onCheckedChange={(checked) =>
                  setNewAgent({ ...newAgent, auto_respond: checked })
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
          {renderAgentForm()}
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
