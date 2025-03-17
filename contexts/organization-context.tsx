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

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgs = await getUserOrganizations();
      setOrganizations(orgs);

      // Si hay organizaciones y no hay una seleccionada, seleccionar la primera
      if (orgs.length > 0 && !currentOrganization) {
        setCurrentOrganization(orgs[0]);
      } else if (orgs.length > 0 && currentOrganization) {
        // Si hay una organización seleccionada, actualizar sus datos
        const currentOrg = orgs.find(
          (org) => org.id === currentOrganization.id
        );
        if (currentOrg) {
          setCurrentOrganization(currentOrg);
        } else {
          // Si la organización seleccionada ya no existe, seleccionar la primera
          setCurrentOrganization(orgs[0]);
        }
      } else if (orgs.length === 0) {
        // Si no hay organizaciones, establecer currentOrganization a null
        setCurrentOrganization(null);
      }
    } catch (err) {
      console.error("Error al obtener organizaciones:", err);
      setError("Error al cargar las organizaciones");
    } finally {
      setLoading(false);
    }
  };

  // Cargar organizaciones al montar el componente
  useEffect(() => {
    fetchOrganizations();
  }, []);

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
