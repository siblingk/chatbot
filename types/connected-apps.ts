type SocialMediaPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "linkedin";

interface MetaAdsConfig {
  enabled: boolean;
  accountConnected: boolean;
}

interface GoogleAdsConfig {
  enabled: boolean;
  accountConnected: boolean;
}

interface SocialMediaAutoPostingConfig {
  enabled: boolean;
  platforms: {
    [key in SocialMediaPlatform]: boolean;
  };
}

interface DcitellyConfig {
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
