import { useTranslations } from "next-intl";
import { GalleryVerticalEnd, Check, ChevronsUpDown } from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export function OrganizationSelector() {
  const t = useTranslations();

  const { currentOrganization, organizations, setCurrentOrganization } =
    useOrganization();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">{t("organizations.title")}</span>
            <span className="">{currentOrganization?.name}</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width]"
        align="start"
      >
        {organizations?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => setCurrentOrganization(org)}
          >
            {org.name}{" "}
            {currentOrganization?.id === org.id && (
              <Check className="ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
