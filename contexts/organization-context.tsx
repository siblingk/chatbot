"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  getUserOrganizations,
  getOrganizationShops,
} from "@/app/actions/organizations";
import { OrganizationWithRole, Shop } from "@/types/organization";
import { useUserRole } from "@/hooks/useUserRole";

// Definición del tipo de contexto
interface OrganizationContextType {
  organizations: OrganizationWithRole[];
  currentOrganization: OrganizationWithRole | null;
  setCurrentOrganization: (organization: OrganizationWithRole) => void;
  loading: boolean;
  error: string | null;
  refetchOrganizations: () => Promise<void>;
  isSuperAdmin: boolean;
  accessibleShops: Shop[];
  loadingShops: boolean;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingShops, setLoadingShops] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [accessibleShops, setAccessibleShops] = useState<Shop[]>([]);
  const { isSuperAdmin: userIsSuperAdmin } = useUserRole();

  // Función para obtener las organizaciones del usuario
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const orgs = await getUserOrganizations();

      // Verificar si hay organizaciones devueltas
      if (orgs && orgs.length > 0) {
        setOrganizations(orgs);

        // Establecer si el usuario es super_admin basado en el hook
        setIsSuperAdmin(userIsSuperAdmin);

        // Si no hay organización actual, establecer la primera como actual
        if (!currentOrganization) {
          setCurrentOrganization(orgs[0]);
        } else {
          // Actualizar la organización actual si ha cambiado
          const updatedCurrentOrg = orgs.find(
            (org) => org.id === currentOrganization.id
          );
          if (updatedCurrentOrg) {
            setCurrentOrganization(updatedCurrentOrg);
          } else {
            setCurrentOrganization(orgs[0]);
          }
        }
      } else {
        // Si no hay organizaciones, establecer el estado correspondiente
        setOrganizations([]);
        setCurrentOrganization(null);
      }
      setError(null);
    } catch (err) {
      console.error("Error al cargar organizaciones:", err);
      setError("Error al cargar organizaciones");
    } finally {
      setLoading(false);
    }
  };

  // Efecto para actualizar isSuperAdmin cuando cambia userIsSuperAdmin
  useEffect(() => {
    setIsSuperAdmin(userIsSuperAdmin);
  }, [userIsSuperAdmin]);

  // Efecto para cargar las tiendas accesibles cuando cambia la organización actual
  useEffect(() => {
    const fetchAccessibleShops = async () => {
      if (!currentOrganization) return;

      try {
        setLoadingShops(true);
        const result = await getOrganizationShops(currentOrganization.id);
        if (result && "data" in result) {
          setAccessibleShops(result.data as Shop[]);
        } else {
          setAccessibleShops([]);
        }
      } catch (err) {
        console.error("Error al cargar tiendas:", err);
        setAccessibleShops([]);
      } finally {
        setLoadingShops(false);
      }
    };

    fetchAccessibleShops();
  }, [currentOrganization]);

  // Efecto para cargar las organizaciones al montar el componente
  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        setCurrentOrganization,
        loading,
        error,
        refetchOrganizations: fetchOrganizations,
        isSuperAdmin,
        accessibleShops,
        loadingShops,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

// Hook para utilizar el contexto
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization debe ser utilizado dentro de un OrganizationProvider"
    );
  }
  return context;
};
