export interface TwilioConfig {
  enabled: boolean;
  apiKey: string;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
}

export interface SendGridConfig {
  enabled: boolean;
  apiKey: string;
}

export interface LeadNotificationPreferences {
  sms: boolean;
  email: boolean;
  both: boolean;
}

export interface TwilioSendGridConfig {
  twilio: TwilioConfig;
  sendGrid: SendGridConfig;
  leadNotificationPreferences: LeadNotificationPreferences;
}
