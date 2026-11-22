export type Product = 'randevu' | 'crm' | 'emlak' | 'logo-erp';

export interface PlanDefinition {
  id: string;
  product: Product;
  name: string;
  interval: 'month' | 'one_time';
  perSeat: boolean;
  /** Teklifle satılır, sitede satın alınamaz. */
  quoteOnly: boolean;
}

export const PLANS: PlanDefinition[] = [
  { id: 'randevu-aylik', product: 'randevu', name: 'Moonvale Randevu', interval: 'month', perSeat: true, quoteOnly: false },
  { id: 'crm-aylik', product: 'crm', name: 'CRM', interval: 'month', perSeat: true, quoteOnly: false },
  { id: 'emlak-aylik', product: 'emlak', name: 'Emlak Sistemi', interval: 'month', perSeat: true, quoteOnly: false },
  { id: 'logo-erp', product: 'logo-erp', name: 'Logo ERP Entegrasyonu', interval: 'one_time', perSeat: false, quoteOnly: true },
];

export interface PublicPlan {
  id: string;
  product: Product;
  name: string;
  interval: 'month' | 'one_time';
  priceKurus: number | null;
  perSeat: boolean;
  purchasable: boolean;
}

export function publicPlans(prices: Record<string, number>): PublicPlan[] {
  return PLANS.map((p) => toPublic(p, prices));
}

export function toPublic(p: PlanDefinition, prices: Record<string, number>): PublicPlan {
  const price = p.quoteOnly ? null : (prices[p.id] ?? null);
  return {
    id: p.id,
    product: p.product,
    name: p.name,
    interval: p.interval,
    priceKurus: price,
    perSeat: p.perSeat,
    purchasable: !p.quoteOnly && price !== null,
  };
}

export function findPlan(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}
