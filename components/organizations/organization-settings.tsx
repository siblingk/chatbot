"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Organization } from "@/types/organization";
import { updateOrganization } from "@/app/actions/organizations";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Mínimo 3 caracteres" })
    .max(100, { message: "Máximo 100 caracteres" }),
});

interface OrganizationSettingsProps {
  organization: Organization;
}

export function OrganizationSettings({
  organization,
}: OrganizationSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.name === organization.name) {
      toast.info("Sin cambios");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateOrganization(organization.id, {
        name: values.name,
      });

      if (result.success) {
        toast.success("Organización actualizada");
        router.refresh();
      } else {
        toast.error(result.error || "Error al actualizar");
      }
    } catch (error: unknown) {
      toast.error("Error al actualizar");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Mi Organización" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </form>
    </Form>
  );
}
