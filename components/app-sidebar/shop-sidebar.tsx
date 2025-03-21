"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Store, ChevronDown, ChevronUp } from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ShopSidebar() {
  const t = useTranslations("ShopSidebar");
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentOrganization, accessibleShops, loadingShops } =
    useOrganization();
  const pathname = usePathname();

  if (!currentOrganization) return null;

  // Filtrar tiendas según el término de búsqueda
  const filteredShops = accessibleShops.filter((shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isShopActive = (shopId: string) => {
    return pathname.includes(`/shops/${shopId}`);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          <span>{t("shops")}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </SidebarGroupLabel>

      {isExpanded && (
        <SidebarGroupContent>
          <div className="mb-2">
            <SidebarInput
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loadingShops ? (
            <div className="text-xs text-muted-foreground px-2">
              {t("loading")}
            </div>
          ) : filteredShops.length > 0 ? (
            <SidebarMenu>
              {filteredShops.map((shop) => (
                <SidebarMenuItem key={shop.id}>
                  <Link
                    href={`/organizations/${currentOrganization.slug}/shops/${shop.id}`}
                    className="w-full"
                    legacyBehavior
                    passHref
                  >
                    <SidebarMenuButton
                      size="sm"
                      isActive={isShopActive(shop.id)}
                    >
                      <Store className="h-4 w-4" />
                      <span>{shop.name}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          ) : (
            <div className="text-xs text-muted-foreground px-2">
              {searchTerm ? t("noResults") : t("noShops")}
            </div>
          )}
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}
