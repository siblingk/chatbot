"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { getUserOrganizations } from "@/app/actions/organizations";
import { OrganizationWithRole } from "@/types/organization";
import { useUserRole } from "@/hooks/useUserRole";

// Organización por defecto
const DEFAULT_ORG: OrganizationWithRole = {
  id: "siblingk",
  name: "Siblingk",
  slug: "siblingk",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  role: "admin",
  shops: [],
};

// Definición del tipo de contexto
interface OrganizationContextType {
  organizations: OrganizationWithRole[];
  currentOrganization: OrganizationWithRole | null;
  setCurrentOrganization: (organization: OrganizationWithRole) => void;
  loading: boolean;
  error: string | null;
  refetchOrganizations: () => Promise<void>;
}

// Creación del contexto
const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

// Props para el proveedor del contexto
interface OrganizationProviderProps {
  children: ReactNode;
}

// Proveedor del contexto
export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>(
    []
  );
  const [currentOrganization, setCurrentOrganization] =
    useState<OrganizationWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useUserRole();

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgs = await getUserOrganizations();

      // Si es admin, agregar Siblingk al inicio de la lista
      const allOrgs = isAdmin ? [DEFAULT_ORG, ...orgs] : orgs;
      setOrganizations(allOrgs);

      // Si no hay organización seleccionada y es admin, usar Siblingk
      if (!currentOrganization) {
        if (isAdmin) {
          setCurrentOrganization(DEFAULT_ORG);
        } else if (allOrgs.length > 0) {
          setCurrentOrganization(allOrgs[0]);
        }
      } else {
        // Si hay una organización seleccionada, actualizar sus datos
        const currentOrg = allOrgs.find(
          (org) => org.id === currentOrganization.id
        );
        if (currentOrg) {
          setCurrentOrganization(currentOrg);
        } else if (isAdmin) {
          // Si la organización seleccionada ya no existe y es admin, usar Siblingk
          setCurrentOrganization(DEFAULT_ORG);
        } else if (allOrgs.length > 0) {
          // Si no es admin, usar la primera organización disponible
          setCurrentOrganization(allOrgs[0]);
        } else {
          setCurrentOrganization(null);
        }
      }
    } catch (err) {
      console.error("Error al obtener organizaciones:", err);
      setError("Error al cargar las organizaciones");
      // En caso de error y siendo admin, usar Siblingk
      if (isAdmin) {
        setOrganizations([DEFAULT_ORG]);
        setCurrentOrganization(DEFAULT_ORG);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar organizaciones al montar el componente o cuando cambia isAdmin
  useEffect(() => {
    fetchOrganizations();
  }, [isAdmin]);

  const value = {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    loading,
    error,
    refetchOrganizations: fetchOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// Hook para usar el contexto
export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}
