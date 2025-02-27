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
import { SheetClose } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  setting?: Setting | null;
  onClose?: () => void;
}

export function SettingsForm({ setting }: SettingsFormProps) {
  const t = useTranslations("settings");
  const router = useRouter();

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
    template_id: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val === "" ? null : val)),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: setting
      ? {
          workshop_id: setting.workshop_id.toString(),
          workshop_name: setting.workshop_name,
          welcome_message: setting.welcome_message,
          interaction_tone: setting.interaction_tone,
          pre_quote_message: setting.pre_quote_message,
          contact_required: setting.contact_required,
          lead_assignment_mode: setting.lead_assignment_mode,
          follow_up_enabled: setting.follow_up_enabled,
          price_source: setting.price_source,
          template_id: setting.template_id,
        }
      : {
          workshop_id: "",
          workshop_name: "",
          welcome_message: "",
          interaction_tone: "",
          pre_quote_message: "",
          contact_required: false,
          lead_assignment_mode: "automatic",
          follow_up_enabled: false,
          price_source: "ai",
          template_id: null,
        },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Aseguramos que template_id sea string | null antes de enviarlo
      const formData = {
        ...values,
        template_id: values.template_id || null,
      };

      console.log(
        "ID del setting a actualizar:",
        setting?.id,
        "Tipo:",
        typeof setting?.id
      );

      const result = setting
        ? await updateSetting(setting.id, formData)
        : await createSetting(formData as SettingFormData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(setting ? t("updateSuccess") : t("createSuccess"));
        // Refrescar la página para mostrar los cambios
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormLabel>{t("templateId")}</FormLabel>
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
        <div className="flex justify-end space-x-2">
          <SheetClose asChild>
            <Button variant="outline" type="button">
              {t("cancel")}
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button type="submit">{t("save")}</Button>
          </SheetClose>
        </div>
      </form>
    </Form>
  );
}
