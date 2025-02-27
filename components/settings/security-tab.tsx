"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SecurityConfig } from "@/types/security";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SecurityTabProps {
  config?: SecurityConfig;
  onUpdate?: (config: Partial<SecurityConfig>) => Promise<void>;
  onLogoutSession?: (device: string) => Promise<void>;
  onUpdateUserRole?: (userId: string, role: string) => Promise<void>;
  onRemoveUser?: (userId: string) => Promise<void>;
}

export function SecurityTab({
  config,
  onUpdate,
  onLogoutSession,
  onUpdateUserRole,
  onRemoveUser,
}: SecurityTabProps) {
  const t = useTranslations("security");

  // Estado local para manejar los cambios antes de guardarlos
  const [localConfig, setLocalConfig] = useState<SecurityConfig>(
    config || {
      twoFactorEnabled: false,
      activeSessions: [],
      userRoles: [],
    }
  );

  // Función para actualizar el estado local
  const handleToggle = (path: string, value: boolean) => {
    const newConfig = { ...localConfig };

    // Actualizar el valor en la ruta especificada
    const parts = path.split(".");
    let current: Record<string, unknown> = newConfig;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;

    setLocalConfig(newConfig);

    // Si hay una función onUpdate, llamarla con los cambios
    if (onUpdate) {
      onUpdate(newConfig);
    }
  };

  // Función para manejar el cierre de sesión
  const handleLogout = async (device: string) => {
    if (onLogoutSession) {
      await onLogoutSession(device);

      // Actualizar el estado local después de cerrar sesión
      const newConfig = {
        ...localConfig,
        activeSessions: localConfig.activeSessions.filter(
          (session) => session.device !== device
        ),
      };

      setLocalConfig(newConfig);
    }
  };

  // Función para actualizar el rol de un usuario
  const handleRoleChange = async (userId: string, role: string) => {
    if (onUpdateUserRole) {
      await onUpdateUserRole(userId, role);

      // Actualizar el estado local después de cambiar el rol
      const newConfig = {
        ...localConfig,
        userRoles: localConfig.userRoles.map((userRole) =>
          userRole.userId === userId
            ? { ...userRole, role: role as "admin" | "manager" | "user" }
            : userRole
        ),
      };

      setLocalConfig(newConfig);
    }
  };

  // Función para eliminar un usuario
  const handleRemoveUser = async (userId: string) => {
    if (onRemoveUser) {
      await onRemoveUser(userId);

      // Actualizar el estado local después de eliminar el usuario
      const newConfig = {
        ...localConfig,
        userRoles: localConfig.userRoles.filter(
          (userRole) => userRole.userId !== userId
        ),
      };

      setLocalConfig(newConfig);
    }
  };

  return (
    <div className="space-y-8">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>{t("twoFactorAuthentication")}</CardTitle>
          <CardDescription>{t("twoFactorDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>{t("enable2FA")}</span>
            <Switch
              checked={localConfig.twoFactorEnabled}
              onCheckedChange={(checked) =>
                handleToggle("twoFactorEnabled", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("loginActivity")}</CardTitle>
          <CardDescription>{t("loginActivityDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("device")}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead>{t("lastActive")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localConfig.activeSessions.length > 0 ? (
                localConfig.activeSessions.map((session, index) => (
                  <TableRow key={index}>
                    <TableCell>{session.device}</TableCell>
                    <TableCell>{session.location}</TableCell>
                    <TableCell>{session.lastActive}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleLogout(session.device)}
                      >
                        {t("logOut")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    {t("noActiveSessions")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Roles & Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("userRolesPermissions")}</CardTitle>
          <CardDescription>{t("userRolesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("user")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localConfig.userRoles.length > 0 ? (
                localConfig.userRoles.map((userRole, index) => (
                  <TableRow key={index}>
                    <TableCell>{userRole.userName}</TableCell>
                    <TableCell>
                      <Select
                        value={userRole.role}
                        onValueChange={(value) =>
                          handleRoleChange(userRole.userId, value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={t("selectRole")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t("admin")}</SelectItem>
                          <SelectItem value="manager">
                            {t("manager")}
                          </SelectItem>
                          <SelectItem value="user">{t("user")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveUser(userRole.userId)}
                      >
                        {t("remove")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    {t("noUsers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
