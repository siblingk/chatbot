interface TwilioConfig {
  enabled: boolean;
  apiKey: string;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}

interface SendGridConfig {
  enabled: boolean;
  apiKey: string;
}

interface LeadNotificationPreferences {
  sms: boolean;
  email: boolean;
  both: boolean;
}

export interface TwilioSendGridConfig {
  twilio: TwilioConfig;
  sendGrid: SendGridConfig;
  leadNotificationPreferences: LeadNotificationPreferences;
}
