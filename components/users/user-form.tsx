"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, createUserAction, updateUserAction } from "@/app/actions/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

interface UserFormProps {
  user?: User | null;
}

export function UserForm({ user }: UserFormProps) {
  const t = useTranslations("users");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const formSchema = z.object({
    email: z.string().email(t("invalidEmail")),
    role: z.enum(["user", "admin"]),
  });

  const defaultValues = {
    email: user?.email || "",
    role: (user?.role === "admin" ? "admin" : "user") as "user" | "admin",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("role", values.role);

      let result;

      if (user) {
        // Actualizar usuario existente
        console.log("Actualizando usuario:", user.id);
        result = await updateUserAction(user.id, { message: "" }, formData);
      } else {
        // Crear nuevo usuario
        console.log("Creando nuevo usuario");
        result = await createUserAction({ message: "" }, formData);
      }

      if (result.message && !result.message.includes("Error")) {
        toast.success(
          result.message || (user ? t("userUpdated") : t("userInvited"))
        );
      } else if (result.errors) {
        // Mostrar errores de validación
        Object.entries(result.errors).forEach(([field, errors]) => {
          errors.forEach((error) => {
            toast.error(`${field}: ${error}`);
          });
        });
      } else if (result.message) {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error en UserForm:", error);
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting;

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <SheetHeader>
          <SheetTitle>{user ? t("editUser") : t("inviteUser")}</SheetTitle>
        </SheetHeader>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input {...field} type="email" disabled={isDisabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("role")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isDisabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectRole")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">{t("user")}</SelectItem>
                  <SelectItem value="admin">{t("admin")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <SheetClose asChild>
            <Button variant="outline" type="button" disabled={isDisabled}>
              {t("cancel")}
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button type="submit" disabled={isDisabled}>
              {user ? t("update") : t("invite")}
            </Button>
          </SheetClose>
        </div>
      </form>
    </Form>
  );
}
