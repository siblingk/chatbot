"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Agent,
  AgentConfig,
  PersonalityTone,
  PreQuoteType,
  ExpirationTime,
} from "@/types/agents";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Lock, Globe, Wand2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

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

  const renderAgentForm = (
    agent: Partial<Agent>,
    setAgent: (agent: Partial<Agent>) => void
  ) => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Agent Name</h3>
        <p className="text-sm text-muted-foreground">
          Enter a name for your AI agent
        </p>
        <Input
          value={agent.name || ""}
          onChange={(e) => setAgent({ ...agent, name: e.target.value })}
          placeholder="Enter agent name..."
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Select AI Agent</h3>
        <p className="text-sm text-muted-foreground">
          Choose whether to use the Quote Builder AI for lead generation or the
          Omni AI for Advanced marketing & optimization
        </p>
        <div className="flex gap-2">
          <Button
            variant={agent.model === "quote-builder-ai" ? "default" : "outline"}
            onClick={() => setAgent({ ...agent, model: "quote-builder-ai" })}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Quote Builder AI
          </Button>
          <Button
            variant={agent.model === "omni-ai" ? "default" : "outline"}
            onClick={() => setAgent({ ...agent, model: "omni-ai" })}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Omni AI
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">AI Personality & Tone</h3>
        <p className="text-sm text-muted-foreground">
          Customize how the AI interacts with customers
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
        <h3 className="text-lg font-medium">Lead Qualification Strategy</h3>
        <p className="text-sm text-muted-foreground">
          Determine how AI filters incoming leads
        </p>
        <div className="flex gap-2">
          <Button
            variant={
              agent.lead_strategy === "Strict-Filtering" ? "default" : "outline"
            }
            onClick={() =>
              setAgent({ ...agent, lead_strategy: "Strict-Filtering" })
            }
          >
            Strict Filtering
          </Button>
          <Button
            variant={
              agent.lead_strategy === "Smart-Targeting" ? "default" : "outline"
            }
            onClick={() =>
              setAgent({ ...agent, lead_strategy: "Smart-Targeting" })
            }
          >
            Smart Targeting
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Custom Welcome Message</h3>
        <Tabs defaultValue="standard" className="w-full">
          <TabsList>
            <TabsTrigger value="standard">Standard Bot Chat</TabsTrigger>
            <TabsTrigger value="custom">Custom Welcome Message</TabsTrigger>
          </TabsList>
        </Tabs>
        <Textarea
          placeholder="e.g. Welcome to AutoFix! How can we assist you today?"
          value={agent.welcome_message}
          onChange={(e) =>
            setAgent({ ...agent, welcome_message: e.target.value })
          }
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pre-Quote Delivery Message</h3>
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
                setAgent({ ...agent, pre_quote_type: type as PreQuoteType })
              }
            >
              {type}
            </Button>
          ))}
        </div>
        <Textarea
          placeholder="Your repair estimate is between $x, $y"
          value={agent.pre_quote_message}
          onChange={(e) =>
            setAgent({ ...agent, pre_quote_message: e.target.value })
          }
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pre-Quote Expiration Time</h3>
        <div className="flex flex-wrap gap-2">
          {["24 Hours", "3 Hours", "7 Days", "Custom"].map((time) => (
            <Button
              key={time}
              variant={agent.expiration_time === time ? "default" : "outline"}
              onClick={() =>
                setAgent({ ...agent, expiration_time: time as ExpirationTime })
              }
            >
              {time}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">System Instructions</h3>
        <p className="text-sm text-muted-foreground">
          Upload or edit system instructions to control behavior
        </p>
        <Textarea
          placeholder="Define AI rules and logic here..."
          value={agent.system_instructions}
          onChange={(e) =>
            setAgent({ ...agent, system_instructions: e.target.value })
          }
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Workflow Automation</h3>
        <p className="text-sm text-muted-foreground">
          Define how AI manages lead assignment and response automation
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Assign Leads</Label>
              <p className="text-sm text-muted-foreground">
                Automatically assign new leads to available agents
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
              <Label>AI Auto-Response</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI to automatically respond to customer inquiries
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
        <h3 className="text-lg font-medium">Visibility</h3>
        <Select
          value={agent.visibility}
          onValueChange={(value: "private" | "public") =>
            setAgent({ ...agent, visibility: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Private
              </div>
            </SelectItem>
            <SelectItem value="public">
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Public
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-end" onClick={() => setIsCreateSheetOpen(true)}>
        <PlusCircle className="h-4 w-4 mr-2" />
        {t("createAgent")}
      </Button>

      {agentConfig?.agents && agentConfig.agents.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("model")}</TableHead>
              <TableHead>{t("visibility")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentConfig.agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.model}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {agent.visibility === "private" ? (
                      <div key="private" className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        {t("private")}
                      </div>
                    ) : (
                      <div key="public" className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        {t("public")}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
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

      {/* Sheet para crear un nuevo agente */}
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

      {/* Sheet para editar un agente */}
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

      {/* Diálogo para confirmar eliminación */}
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
