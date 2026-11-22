export interface Order {
  id: string;
  planId: string;
  seats: number;
  amountKurus: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  companySlug: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  orderId: string;
  planId: string;
  product: string;
  seats: number;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  companySlug: string | null;
  provisioning: 'none' | 'pending' | 'done' | 'failed';
}

export interface Invoice {
  id: string;
  number: string;
  orderId: string;
  amountKurus: number;
  issuedAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  createdAt: string;
  messages?: { author: 'customer' | 'staff'; body: string; createdAt: string }[];
}

export const PLAN_NAMES: Record<string, string> = {
  'randevu-aylik': 'Moonvale Randevu',
  'crm-aylik': 'CRM',
  'emlak-aylik': 'Emlak Sistemi',
  'logo-erp': 'Logo ERP Entegrasyonu',
};

export const RANDEVU_DOMAIN = process.env.NEXT_PUBLIC_RANDEVU_DOMAIN ?? 'moonvalesoft.com';
export const salonUrl = (slug: string) => `https://${slug}.${RANDEVU_DOMAIN}`;
