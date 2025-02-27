export type SocialMediaPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "linkedin";

export interface MetaAdsConfig {
  enabled: boolean;
  accountConnected: boolean;
}

export interface GoogleAdsConfig {
  enabled: boolean;
  accountConnected: boolean;
}

export interface SocialMediaAutoPostingConfig {
  enabled: boolean;
  platforms: {
    [key in SocialMediaPlatform]: boolean;
  };
}

export interface DcitellyConfig {
  enabled: boolean;
  accountConnected: boolean;
  autoSync: {
    invoices: boolean;
    repairOrders: boolean;
  };
}

export interface ConnectedAppsConfig {
  metaAds: MetaAdsConfig;
  googleAds: GoogleAdsConfig;
  socialMediaAutoPosting: SocialMediaAutoPostingConfig;
  dcitelly: DcitellyConfig;
}
