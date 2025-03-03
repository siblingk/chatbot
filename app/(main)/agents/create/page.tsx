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
import { Bot, ArrowLeft } from "lucide-react";
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
import { generateUUID } from "@/utils/uuid";
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

  const handleCreateAgent = async () => {
    try {
      if (!newAgent.name) {
        toast.error(t("settings.errorCreatingAgent"));
        return;
      }

      // Crear un ID único para el nuevo agente
      const agentToCreate: Agent = {
        ...(newAgent as Agent),
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user?.id || "",
      };

      await updateAgent(agentToCreate);
      toast.success(t("settings.agentCreated"));
      router.push(`/agents/${user?.id}`);
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error(t("settings.errorCreatingAgent"));
    }
  };

  const renderAgentForm = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.agentName")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.enterAgentName")}
        </p>
        <Input
          value={newAgent.name || ""}
          onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
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
            variant={
              newAgent.model === "quote-builder-ai" ? "default" : "outline"
            }
            onClick={() =>
              setNewAgent({ ...newAgent, model: "quote-builder-ai" })
            }
          >
            {t("settings.quoteBuilderAI")}
          </Button>
          <Button
            variant={newAgent.model === "omni-ai" ? "default" : "outline"}
            onClick={() => setNewAgent({ ...newAgent, model: "omni-ai" })}
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
                  newAgent.personality_tone === tone ? "default" : "outline"
                }
                onClick={() =>
                  setNewAgent({
                    ...newAgent,
                    personality_tone: tone as PersonalityTone,
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
          value={newAgent.welcome_message || ""}
          onChange={(e) => {
            const newMessage = e.target.value;
            setNewAgent({ ...newAgent, welcome_message: newMessage });
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
              variant={newAgent.pre_quote_type === type ? "default" : "outline"}
              onClick={() =>
                setNewAgent({
                  ...newAgent,
                  pre_quote_type: type as PreQuoteType,
                })
              }
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
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.expirationTime")}</h3>
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
          value={newAgent.system_instructions || ""}
          onChange={(e) =>
            setNewAgent({ ...newAgent, system_instructions: e.target.value })
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
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("settings.visibility")}</h3>
        <Select
          value={newAgent.visibility}
          onValueChange={(value: "private" | "public") =>
            setNewAgent({ ...newAgent, visibility: value })
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
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => router.back()}>
              {t("settings.cancel")}
            </Button>
            <Button onClick={handleCreateAgent} disabled={!newAgent.name}>
              {t("settings.createAgent")}
            </Button>
          </div>
        </div>
        <div className="hidden lg:block h-[calc(100vh-200px)] sticky top-8">
          <AgentChatPreview agent={newAgent} />
        </div>
      </div>
    </div>
  );
}
