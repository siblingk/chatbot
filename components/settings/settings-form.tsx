"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Setting, SettingFormData } from "@/types/settings";
import { createSetting, updateSetting } from "@/app/actions/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface SettingsFormProps {
  setting?: Setting | null;
  onClose: () => void;
}

export function SettingsForm({ setting, onClose }: SettingsFormProps) {
  const t = useTranslations("settings");

  const formSchema = z.object({
    workshop_id: z.string().min(1, t("requiredField")),
    workshop_name: z.string().min(1, t("requiredField")),
    welcome_message: z.string().min(1, t("requiredField")),
    interaction_tone: z.string().min(1, t("requiredField")),
    pre_quote_message: z.string().min(1, t("requiredField")),
    contact_required: z.boolean(),
    lead_assignment_mode: z.enum(["automatic", "manual"]),
    follow_up_enabled: z.boolean(),
    price_source: z.enum(["ai", "dcitelly_api"]),
    template_id: z.string().nullable(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: setting || {
      workshop_id: "",
      workshop_name: "",
      welcome_message: "",
      interaction_tone: "",
      pre_quote_message: "",
      contact_required: false,
      lead_assignment_mode: "manual",
      follow_up_enabled: true,
      price_source: "ai",
      template_id: null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = setting
        ? await updateSetting(Number(setting.id), values)
        : await createSetting(values as SettingFormData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(setting ? t("updateSuccess") : t("createSuccess"));
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <SheetHeader>
          <SheetTitle>
            {setting ? t("editWorkshop") : t("createWorkshop")}
          </SheetTitle>
        </SheetHeader>

        <FormField
          control={form.control}
          name="workshop_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("workshopId")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="workshop_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("workshopName")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="welcome_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("welcomeMessage")}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interaction_tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("interactionTone")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pre_quote_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("preQuoteMessage")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lead_assignment_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("leadAssignmentMode")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectMode")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="automatic">{t("automatic")}</SelectItem>
                  <SelectItem value="manual">{t("manual")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price_source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("priceSource")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectSource")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ai">{t("ai")}</SelectItem>
                  <SelectItem value="dcitelly_api">
                    {t("dcitellyApi")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t("contactRequired")}
                </FormLabel>
                <FormDescription>{t("contactRequiredDesc")}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="follow_up_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t("followUpEnabled")}
                </FormLabel>
                <FormDescription>{t("followUpEnabledDesc")}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="template_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de Plantilla</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Opcional: ID de la plantilla para mensajes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} type="button">
            {t("cancel")}
          </Button>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Form>
  );
}
