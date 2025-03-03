"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAgents, deleteAgent } from "@/app/actions/agents";
import { Agent } from "@/types/agents";
import { useAuth } from "@/contexts/auth-context";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import {
  Bot,
  RefreshCw,
  Shield,
  AlertCircle,
  PlusCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AgentsPage() {
  const { userId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const t = useTranslations();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    // Verificar si el usuario es administrador o si está accediendo a su propia página
    if (!isAdmin && user?.id !== userId) {
      redirect("/");
    }

    const fetchAgents = async () => {
      setLoading(true);
      try {
        const agentsData = await getAgents();
        setAgents(agentsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError(t("settings.errorLoading"));
        toast.error(t("settings.errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [userId, user, isAdmin, t]);

  const handleDeleteAgent = async () => {
    try {
      if (!currentAgent?.id) {
        toast.error(t("settings.errorDeletingAgent"));
        return;
      }

      await deleteAgent(currentAgent.id);
      setIsDeleteDialogOpen(false);
      setCurrentAgent(null);

      // Actualizar la lista de agentes
      setAgents((prevAgents) =>
        prevAgents.filter((a) => a.id !== currentAgent.id)
      );

      toast.success(t("settings.agentDeleted"));
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error(t("settings.errorDeletingAgent"));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center gap-2 mb-8">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t("settings.agents")}</h1>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center gap-2 mb-8">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t("settings.agents")}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t("settings.errorTitle")}
          </h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            {error}
          </p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("settings.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-row md:flex-row md:items-center gap-4 mb-8">
        <Bot className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">{t("settings.agents")}</h1>
        {isAdmin && (
          <Badge variant="outline" className="ml-2 gap-1">
            <Shield className="h-3 w-3" />
            {t("settings.adminOnly")}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Button
          className="self-end"
          onClick={() => router.push(`/agents/create`)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {t("settings.createAgent")}
        </Button>

        {agents && agents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.name")}</TableHead>
                <TableHead>{t("settings.model")}</TableHead>
                <TableHead>{t("settings.visibility")}</TableHead>
                <TableHead className="text-right">
                  {t("settings.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.model}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {agent.visibility === "private" ? (
                        <div key="private" className="flex items-center">
                          {t("settings.private")}
                        </div>
                      ) : (
                        <div key="public" className="flex items-center">
                          {t("settings.public")}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/agents/${userId}/edit/${agent.id}`)
                        }
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">{t("settings.edit")}</span>
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
                        <span className="sr-only">{t("settings.delete")}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 border rounded-md bg-muted/20">
            <p className="text-muted-foreground">{t("settings.noAgents")}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/agents/create`)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("settings.createAgent")}
            </Button>
          </div>
        )}
      </div>

      {/* Diálogo para confirmar eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.deleteAgent")}</DialogTitle>
            <DialogDescription>
              {t("settings.deleteAgentConfirmation", {
                name: currentAgent?.name || "",
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
