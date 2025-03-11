"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Agent,
  AgentConfig,
  PersonalityTone,
  PreQuoteType,
  ExpirationTime,
  LeadStrategy,
} from "@/types/agents";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface AgentsTabProps {
  agentConfig?: AgentConfig;
  onUpdateAgents?: (agent: Agent) => Promise<void>;
  onDeleteAgent?: (agentId: string) => Promise<void>;
}

export function AgentsTab({
  agentConfig,
  onUpdateAgents,
  onDeleteAgent,
}: AgentsTabProps) {
  const t = useTranslations("settings");
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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
    is_active: true,
    target_role: "both",
    target_agent_id: undefined,
  });

  const handleCreateAgent = async () => {
    try {
      if (!onUpdateAgents) return;

      // Crear el agente con los campos en snake_case
      const tempAgent = {
        name: newAgent.name,
        model: newAgent.model,
        visibility: newAgent.visibility,
        personality_tone: newAgent.personality_tone,
        lead_strategy: newAgent.lead_strategy,
        welcome_message: newAgent.welcome_message,
        pre_quote_message: newAgent.pre_quote_message,
        pre_quote_type: newAgent.pre_quote_type,
        expiration_time: newAgent.expiration_time,
        system_instructions: newAgent.system_instructions,
        auto_assign_leads: newAgent.auto_assign_leads,
        auto_respond: newAgent.auto_respond,
        is_active: newAgent.is_active,
        target_role: newAgent.target_role,
        target_agent_id: newAgent.target_agent_id,
      } as Partial<Agent>;

      await onUpdateAgents(tempAgent as Agent);
      setIsCreateSheetOpen(false);
      setNewAgent({
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
        is_active: true,
        target_role: "both",
        target_agent_id: undefined,
      });
      toast.success(t("agentCreated"));
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error(t("errorCreatingAgent"));
    }
  };

  const handleEditAgent = async () => {
    try {
      if (!onUpdateAgents || !currentAgent) return;

      await onUpdateAgents(currentAgent);
      setIsEditDialogOpen(false);
      setCurrentAgent(null);
      toast.success(t("agentUpdated"));
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error(t("errorUpdatingAgent"));
    }
  };

  const handleDeleteAgent = async () => {
    try {
      if (!onDeleteAgent || !currentAgent?.id) {
        toast.error(t("errorDeletingAgent"));
        return;
      }

      await onDeleteAgent(currentAgent.id);
      setIsDeleteDialogOpen(false);
      setCurrentAgent(null);
      toast.success(t("agentDeleted"));
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error(t("errorDeletingAgent"));
    }
  };

  const handleCopyInstructions = (instructions: string | undefined) => {
    if (instructions) {
      navigator.clipboard.writeText(instructions);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const renderAgentForm = (
    agent: Partial<Agent>,
    onChange: (updatedAgent: Partial<Agent>) => void
  ) => {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="agent-name">{t("agentName")}</Label>
          <Input
            id="agent-name"
            placeholder={t("enterAgentNamePlaceholder")}
            value={agent.name || ""}
            onChange={(e) => onChange({ ...agent, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-model">{t("agentModel")}</Label>
          <Select
            value={agent.model || "quote-builder-ai"}
            onValueChange={(value) =>
              onChange({
                ...agent,
                model: value as "quote-builder-ai" | "omni-ai",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectAIAgent")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quote-builder-ai">
                {t("quoteBuilderAI")}
              </SelectItem>
              <SelectItem value="omni-ai">{t("omniAI")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("chooseAIType")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-visibility">{t("agentVisibility")}</Label>
          <Select
            value={agent.visibility || "private"}
            onValueChange={(value) =>
              onChange({
                ...agent,
                visibility: value as "private" | "public",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectVisibility")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">{t("private")}</SelectItem>
              <SelectItem value="public">{t("public")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-status">{t("agentStatus")}</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="agent-status"
              checked={agent.is_active !== false}
              onCheckedChange={(checked) =>
                onChange({ ...agent, is_active: checked })
              }
            />
            <Label htmlFor="agent-status" className="cursor-pointer">
              {agent.is_active !== false
                ? t("agentActive")
                : t("agentInactive")}
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-target-role">{t("agentTargetRole")}</Label>
          <Select
            value={agent.target_role || "both"}
            onValueChange={(value) =>
              onChange({
                ...agent,
                target_role: value as "user" | "shop" | "both",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("agentTargetRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">{t("agentTargetRoleUser")}</SelectItem>
              <SelectItem value="shop">{t("agentTargetRoleShop")}</SelectItem>
              <SelectItem value="both">{t("agentTargetRoleBoth")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("agentTargetRoleDescription")}
          </p>
        </div>

        {agentConfig && agentConfig.agents && agentConfig.agents.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="agent-target-agent">{t("agentTargetAgent")}</Label>
            <Select
              value={agent.target_agent_id || ""}
              onValueChange={(value) =>
                onChange({
                  ...agent,
                  target_agent_id: value === "" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("agentTargetAgent")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("agentTargetAgentNone")}</SelectItem>
                {agentConfig.agents
                  .filter((a) => a.id !== agent.id)
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("agentTargetAgentDescription")}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="agent-personality">{t("agentPersonality")}</Label>
          <Select
            value={agent.personality_tone || "Friendly"}
            onValueChange={(value) =>
              onChange({
                ...agent,
                personality_tone: value as PersonalityTone,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("agentPersonality")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Friendly">Friendly</SelectItem>
              <SelectItem value="Formal">Formal</SelectItem>
              <SelectItem value="Sales-Driven">Sales-Driven</SelectItem>
              <SelectItem value="Sales-Focused">Sales-Focused</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("customizeAIInteraction")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-lead-strategy">{t("agentLeadStrategy")}</Label>
          <Select
            value={agent.lead_strategy || "Smart-Targeting"}
            onValueChange={(value) =>
              onChange({
                ...agent,
                lead_strategy: value as LeadStrategy,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("agentLeadStrategy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Strict-Filtering">
                {t("strictFiltering")}
              </SelectItem>
              <SelectItem value="Smart-Targeting">
                {t("smartTargeting")}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("determineLeadFiltering")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-welcome-message">
            {t("agentWelcomeMessage")}
          </Label>
          <Textarea
            id="agent-welcome-message"
            placeholder={t("welcomeMessagePlaceholder")}
            value={agent.welcome_message || ""}
            onChange={(e) =>
              onChange({ ...agent, welcome_message: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-pre-quote-message">
            {t("agentPreQuoteMessage")}
          </Label>
          <Textarea
            id="agent-pre-quote-message"
            placeholder={t("preQuoteMessagePlaceholder")}
            value={agent.pre_quote_message || ""}
            onChange={(e) =>
              onChange({ ...agent, pre_quote_message: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-pre-quote-type">{t("agentPreQuoteType")}</Label>
          <Select
            value={agent.pre_quote_type || "Standard"}
            onValueChange={(value) =>
              onChange({
                ...agent,
                pre_quote_type: value as PreQuoteType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("agentPreQuoteType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="With Warranty">With Warranty</SelectItem>
              <SelectItem value="Detailed Explanation">
                Detailed Explanation
              </SelectItem>
              <SelectItem value="Special Offer">Special Offer</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-expiration-time">
            {t("agentExpirationTime")}
          </Label>
          <Select
            value={agent.expiration_time || "24 Hours"}
            onValueChange={(value) =>
              onChange({
                ...agent,
                expiration_time: value as ExpirationTime,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("agentExpirationTime")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24 Hours">24 Hours</SelectItem>
              <SelectItem value="3 Hours">3 Hours</SelectItem>
              <SelectItem value="7 Days">7 Days</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-system-instructions">
            {t("agentSystemInstructions")}
          </Label>
          <div className="relative">
            {isEditingInstructions ? (
              <div className="space-y-4">
                <Textarea
                  id="agent-system-instructions"
                  placeholder={t("systemInstructionsPlaceholder")}
                  value={agent.system_instructions || ""}
                  onChange={(e) =>
                    onChange({ ...agent, system_instructions: e.target.value })
                  }
                  className="min-h-[250px] font-mono text-sm"
                  rows={8}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsEditingInstructions(false)}
                    className="ml-2"
                  >
                    {t("done")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border rounded-md relative">
                <div className="absolute right-2 top-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleCopyInstructions(agent.system_instructions)
                    }
                    title={t("copy")}
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
                    title={t("edit")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 min-h-[250px] overflow-y-auto bg-background">
                  {agent.system_instructions ? (
                    <MarkdownRenderer content={agent.system_instructions} />
                  ) : (
                    <p className="text-muted-foreground italic">
                      {t("noContentToPreview")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("systemInstructionsDescription")}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">{t("workflowAutomation")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("workflowAutomationDescription")}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-assign-leads"
              checked={agent.auto_assign_leads !== false}
              onCheckedChange={(checked) =>
                onChange({ ...agent, auto_assign_leads: checked })
              }
            />
            <Label htmlFor="auto-assign-leads" className="cursor-pointer">
              {t("autoAssignLeads")}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground pl-7">
            {t("autoAssignLeadsDescription")}
          </p>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-respond"
              checked={agent.auto_respond !== false}
              onCheckedChange={(checked) =>
                onChange({ ...agent, auto_respond: checked })
              }
            />
            <Label htmlFor="auto-respond" className="cursor-pointer">
              {t("aiAutoResponse")}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground pl-7">
            {t("aiAutoResponseDescription")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t("agents")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("agentsDescription")}
          </p>
        </div>
        <Button onClick={() => setIsCreateSheetOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {t("createAgent")}
        </Button>
      </div>

      {agentConfig && agentConfig.agents && agentConfig.agents.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("agentName")}</TableHead>
              <TableHead>{t("agentModel")}</TableHead>
              <TableHead>{t("agentVisibility")}</TableHead>
              <TableHead>{t("agentStatus")}</TableHead>
              <TableHead>{t("agentTargetRole")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentConfig.agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.model}</TableCell>
                <TableCell>{agent.visibility}</TableCell>
                <TableCell>
                  <Badge
                    variant={agent.is_active !== false ? "default" : "outline"}
                    className={agent.is_active !== false ? "bg-green-500" : ""}
                  >
                    {agent.is_active !== false
                      ? t("agentActive")
                      : t("agentInactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {t(
                    `agentTargetRole${
                      agent.target_role
                        ? agent.target_role.charAt(0).toUpperCase() +
                          agent.target_role.slice(1)
                        : "Both"
                    }`
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updatedAgent = {
                          ...agent,
                          is_active: !agent.is_active,
                        };
                        if (onUpdateAgents) {
                          onUpdateAgents(updatedAgent);
                          toast.success(
                            agent.is_active
                              ? t("agentDeactivated")
                              : t("agentActivated")
                          );
                        }
                      }}
                    >
                      {agent.is_active !== false ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {agent.is_active !== false
                          ? t("deactivateAgent")
                          : t("activateAgent")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCurrentAgent(agent);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t("edit")}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCurrentAgent(agent);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t("delete")}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">{t("noAgents")}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsCreateSheetOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("createAgent")}
          </Button>
        </div>
      )}

      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("createNewAgent")}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {renderAgentForm(newAgent, (agent) => setNewAgent(agent))}
          </div>
          <SheetFooter className="pt-4">
            <SheetClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </SheetClose>
            <Button onClick={handleCreateAgent} disabled={!newAgent.name}>
              {t("createAgent")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("editAgent")}</SheetTitle>
          </SheetHeader>
          {currentAgent && (
            <div className="py-4">
              {renderAgentForm(currentAgent, (agent) =>
                setCurrentAgent({ ...currentAgent, ...agent })
              )}
            </div>
          )}
          <SheetFooter className="pt-4">
            <SheetClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </SheetClose>
            <Button onClick={handleEditAgent}>{t("save")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteAgent")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              {t("deleteAgentConfirmation", {
                name: currentAgent?.name || "",
              })}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgent}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
