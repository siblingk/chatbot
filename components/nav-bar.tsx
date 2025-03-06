"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Search,
  MessageCircle,
  Receipt,
  MoreHorizontal,
  Bot,
  NotepadText,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

export function NavBar() {
  const t = useTranslations("navbar");

  return (
    <nav className="sticky top-0 z-50 w-full bg-background">
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center">
          <SidebarTrigger className="h-8 w-8" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">{t("moreOptions")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center gap-2">
                  <NotepadText className="h-4 w-4" />
                  <span>{t("prequote")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{t("appointment")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span>{t("quote")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Receipt className="h-5 w-5" />
                    <span className="sr-only">{t("invoice")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("invoice")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Bot className="h-5 w-5" />
                    <span className="sr-only">{t("ai")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("ai")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MessageCircle className="h-5 w-5" />
                    <span className="sr-only">{t("chat")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("chat")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </nav>
  );
}
