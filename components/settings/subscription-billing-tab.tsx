"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SubscriptionBillingConfig } from "@/types/subscription-billing";
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
import { Badge } from "@/components/ui/badge";

interface SubscriptionBillingTabProps {
  config?: SubscriptionBillingConfig;
  onUpdate?: (config: Partial<SubscriptionBillingConfig>) => Promise<void>;
  onChangePlan?: () => Promise<void>;
  onUpdatePaymentInfo?: () => Promise<void>;
  locale?: string;
}

export function SubscriptionBillingTab({
  config,
  onUpdate,
  onChangePlan,
  onUpdatePaymentInfo,
  locale,
}: SubscriptionBillingTabProps) {
  const t = useTranslations("subscriptionBilling");

  // Estado local para manejar los cambios antes de guardarlos
  const [localConfig, setLocalConfig] = useState<SubscriptionBillingConfig>(
    config || {
      currentPlan: {
        name: "Premium",
        price: 99,
        billingCycle: "monthly",
        features: [],
      },
      paymentMethod: {
        type: "visa",
        lastFourDigits: "4242",
        expiryDate: "12/25",
      },
      autoRenewal: true,
      billingHistory: [],
    }
  );

  // Función para actualizar el estado local
  const handleToggle = (value: boolean) => {
    const newConfig = {
      ...localConfig,
      autoRenewal: value,
    };

    setLocalConfig(newConfig);

    // Si hay una función onUpdate, llamarla con los cambios
    if (onUpdate) {
      onUpdate(newConfig);
    }
  };

  // Función para formatear el precio
  const formatPrice = (price: number, cycle: string) => {
    return `$${price}/${cycle === "monthly" ? t("month") : t("year")}`;
  };

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Función para obtener el color del badge según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>{t("currentPlan")}</CardTitle>
          <CardDescription>{t("managePlanDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">
                {localConfig.currentPlan.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatPrice(
                  localConfig.currentPlan.price,
                  localConfig.currentPlan.billingCycle
                )}
              </p>
            </div>
            <Button onClick={onChangePlan}>{t("changePlan")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>{t("paymentMethod")}</CardTitle>
          <CardDescription>{t("paymentMethodDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">
                {localConfig.paymentMethod.type.toUpperCase()} **** **** ****{" "}
                {localConfig.paymentMethod.lastFourDigits}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("expires")}: {localConfig.paymentMethod.expiryDate}
              </p>
            </div>
            <Button onClick={onUpdatePaymentInfo}>
              {t("updatePaymentInfo")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Renewal */}
      <Card>
        <CardHeader>
          <CardTitle>{t("autoRenewal")}</CardTitle>
          <CardDescription>{t("autoRenewalDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>{t("enableAutoRenewal")}</span>
            <Switch
              checked={localConfig.autoRenewal}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("billingHistory")}</CardTitle>
          <CardDescription>{t("billingHistoryDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localConfig.billingHistory.length > 0 ? (
                localConfig.billingHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>${item.amount}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {t(item.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    {t("noBillingHistory")}
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
