import { TechRule } from '../types';

export const paymentRules: TechRule[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payment',
    website: 'https://stripe.com',
    icon: '/tech-icons/payments/stripe.svg',
    description: 'Financial infrastructure and online payment processing platform.',
    signals: {
      globals: [
        { path: 'Stripe', weight: 60 },
      ],
      resources: [
        { urlRegex: /js\.stripe\.com\/v[23]\/?/i, weight: 45 },
      ],
      dom: [
        { selector: 'iframe[src*="js.stripe.com"]', weight: 40 },
        { selector: 'script[src*="js.stripe.com"]', weight: 35 },
      ],
    },
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    category: 'payment',
    website: 'https://razorpay.com',
    icon: '/tech-icons/payments/razorpay.svg',
    description: 'Converged payments solution and gateway for internet businesses.',
    signals: {
      globals: [
        { path: 'Razorpay', weight: 60 },
      ],
      resources: [
        { urlRegex: /checkout\.razorpay\.com\/v1\/checkout\.js/i, weight: 45 },
      ],
      dom: [
        { selector: 'iframe[src*="checkout.razorpay.com"]', weight: 40 },
      ],
    },
  },
];
