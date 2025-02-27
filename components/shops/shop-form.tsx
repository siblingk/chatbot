/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Shop } from "@/types/shops";
import { createShopAction, updateShopAction } from "@/app/actions/shops";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader } from "@/components/ui/loader";

// Schema de validación para el formulario
const formSchema = (t: any) =>
  z.object({
    name: z.string().min(1, t("nameRequired")),
    location: z.string().min(1, t("locationRequired")),
    rating: z.coerce.number().min(0).max(5),
    status: z.enum(["active", "inactive"]),
    rate: z.coerce.number().min(0),
    labor_tax_percentage: z.coerce.number().min(0).max(100),
    parts_tax_percentage: z.coerce.number().min(0).max(100),
    misc_tax_percentage: z.coerce.number().min(0).max(100),
  });

interface ShopFormProps {
  shop: Shop | null;
}

export function ShopForm({ shop }: ShopFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("shops");
  const router = useRouter();

  // Inicializar el formulario con los valores por defecto
  // @ts-expect-error asdasd
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      name: shop?.name || "",
      location: shop?.location || "",
      rating: shop?.rating || 0,
      status: shop?.status || "active",
      rate: shop?.rate || 0,
      labor_tax_percentage: shop?.labor_tax_percentage || 0,
      parts_tax_percentage: shop?.parts_tax_percentage || 0,
      misc_tax_percentage: shop?.misc_tax_percentage || 0,
    },
  });

  // Manejar el envío del formulario
  // @ts-expect-error asdasd
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      // @ts-expect-error asdasd
      Object.entries(values).forEach(([key, value]) => {
        // @ts-expect-error asdasd
        formData.append(key, value.toString());
      });

      const result = shop
        ? await updateShopAction(shop.id, {}, formData)
        : await createShopAction({}, formData);

      if (result.message && !result.message.includes("Error")) {
        toast.success(shop ? t("updateSuccess") : t("createSuccess"));
        router.refresh();
      } else {
        toast.error(result.message || t("error"));
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // @ts-expect-error asdasd
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          // @ts-expect-error asdasd
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("namePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error asdasd
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("location")}</FormLabel>
              <FormControl>
                <Input placeholder={t("locationPlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error asdasd
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("rating")}</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectRating")} />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} {rating === 1 ? t("star") : t("stars")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error asdasd
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("status")}</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="inactive">{t("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error asdasd
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("rate")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("ratePlaceholder")}
                  {...field}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value
                  }
                />
              </FormControl>
              <FormDescription>{t("rateDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error asdasd
          control={form.control}
          name="labor_tax_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("laborTaxPercentage")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("laborTaxPercentagePlaceholder")}
                  {...field}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value
                  }
                />
              </FormControl>
              <FormDescription>
                {t("laborTaxPercentageDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error asdasd
          control={form.control}
          name="parts_tax_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("partsTaxPercentage")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("partsTaxPercentagePlaceholder")}
                  {...field}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value
                  }
                />
              </FormControl>
              <FormDescription>
                {t("partsTaxPercentageDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error asdasd
          control={form.control}
          name="misc_tax_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("miscTaxPercentage")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("miscTaxPercentagePlaceholder")}
                  {...field}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value
                  }
                />
              </FormControl>
              <FormDescription>
                {t("miscTaxPercentageDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader className="mr-2 h-4 w-4" />}
            {shop ? t("update") : t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
