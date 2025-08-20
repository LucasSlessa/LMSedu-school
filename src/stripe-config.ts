export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    priceId: 'price_marketing_course',
    name: 'Curso Teste - marketing',
    description: 'Curso Teste - marketing',
    price: 10.00,
  },
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};