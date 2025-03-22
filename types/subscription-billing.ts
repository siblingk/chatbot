interface PaymentMethod {
  type: "visa" | "mastercard" | "amex" | "discover";
  lastFourDigits: string;
  expiryDate: string;
}

interface Plan {
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  features: string[];
}

export interface SubscriptionBillingConfig {
  currentPlan: Plan;
  paymentMethod: PaymentMethod;
  autoRenewal: boolean;
  billingHistory: {
    date: string;
    amount: number;
    description: string;
    status: "paid" | "pending" | "failed";
  }[];
}
