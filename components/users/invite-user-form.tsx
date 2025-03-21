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
import { inviteUserByEmailAction } from "@/app/actions/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SheetClose } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppRole } from "@/types/auth";

interface InviteUserFormProps {
  organizationId?: string;
}

export function InviteUserForm({ organizationId }: InviteUserFormProps) {
  const t = useTranslations("users");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const formSchema = z.object({
    email: z.string().email(),
    role: z.enum([
      "super_admin",
      "admin",
      "colaborador",
      "user",
      "shop",
    ] as const),
  });

  const defaultValues = {
    email: "",
    role: "user" as AppRole,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Invitar usuario usando la función de invitación por email
      console.log("Invitando nuevo usuario");
      const result = await inviteUserByEmailAction({
        email: values.email,
        role: values.role as AppRole,
        organizationId: organizationId || null,
      });

      if (result.success) {
        toast.success(t("userInvited"));
        form.reset();
        router.refresh();
      } else if (result.message) {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error al invitar usuario:", error);
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
                  <SelectItem value="super_admin">
                    {t("super_admin")}
                  </SelectItem>
                  <SelectItem value="admin">{t("admin")}</SelectItem>
                  <SelectItem value="colaborador">
                    {t("colaborador")}
                  </SelectItem>
                  <SelectItem value="user">{t("user")}</SelectItem>
                  <SelectItem value="shop">{t("shop")}</SelectItem>
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
              {t("invite")}
            </Button>
          </SheetClose>
        </div>
      </form>
    </Form>
  );
}
