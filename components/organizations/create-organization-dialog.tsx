"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
import { createOrganization } from "@/app/actions/organizations";
import { useTranslations } from "next-intl";

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Mínimo 3 caracteres" })
    .max(100, { message: "Máximo 100 caracteres" }),
  slug: z
    .string()
    .min(3, { message: "Mínimo 3 caracteres" })
    .max(100, { message: "Máximo 100 caracteres" })
    .optional(),
});

export function CreateOrganizationDialog() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  // Función para generar un slug a partir del nombre
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Actualizar el slug cuando cambia el nombre
  const onNameChange = (name: string) => {
    form.setValue("slug", generateSlug(name));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await createOrganization(values.name, values.slug);

      if (!result.success) {
        throw new Error(result.error || t("common.error"));
      }

      toast.success(t("organizations.createSuccess"));
      setOpen(false);
      form.reset();
      router.refresh();

      // Redirigir a la página de la organización creada si hay un ID
      if (result.data?.id) {
        router.push(`/organizations/${result.data.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t("organizations.new")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t("organizations.new")}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("organizations.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("organizations.namePlaceholder")}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        onNameChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("organizations.slug")}</FormLabel>
                  <FormControl>
                    <Input placeholder="mi-organizacion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                {t("organizations.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    {t("organizations.creating")}
                  </>
                ) : (
                  t("common.create")
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
