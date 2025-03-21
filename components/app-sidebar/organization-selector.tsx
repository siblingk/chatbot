import { Building, Check, ChevronsUpDown } from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function OrganizationSelector() {
  const { currentOrganization, organizations, setCurrentOrganization } =
    useOrganization();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex justify-between items-center gap-1 h-8 w-full px-2"
        >
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="font-medium truncate">
              {currentOrganization?.name}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[180px]"
        align="start"
      >
        {organizations?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => setCurrentOrganization(org)}
          >
            <span className="truncate">{org.name}</span>
            {currentOrganization?.id === org.id && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
