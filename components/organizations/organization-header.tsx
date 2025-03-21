import { Organization } from "@/types/organization";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, MapPin } from "lucide-react";

interface OrganizationHeaderProps {
  organization: Organization;
  userRole?: string;
}

export function OrganizationHeader({
  organization,
  userRole,
}: OrganizationHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{organization.name}</h1>
              {userRole && <Badge variant="outline">{userRole}</Badge>}
            </div>
            <div className="flex items-center text-muted-foreground text-sm mt-2">
              <Building2 className="h-4 w-4 mr-2" />
              <span>ID: {organization.id}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                Creada el{" "}
                {new Date(organization.created_at).toLocaleDateString()}
              </span>
            </div>
            {organization.address && (
              <div className="flex items-center text-muted-foreground text-sm mt-1">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{organization.address}</span>
              </div>
            )}
          </div>

          <div className="mt-4 md:mt-0 md:text-right">
            <div className="flex items-center justify-end gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold">
                  {/* @ts-expect-error asdasd */}
                  {organization.shops?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Talleres</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
