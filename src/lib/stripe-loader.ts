// // lib/stripe-loader.ts
// import { loadStripe, Stripe } from '@stripe/stripe-js';

// let stripePromise: Promise<Stripe | null> | null = null;
// let stripeLoadAttempted = false;

// export const getStripe = (): Promise<Stripe | null> | null => {
//   // Only attempt to load once
//   if (stripeLoadAttempted) {
//     return stripePromise;
//   }

//   const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
//   if (!key) {
//     console.error('[Stripe] Missing publishable key');
//     stripeLoadAttempted = true;
//     return null;
//   }

//   // Check if we're in a browser environment
//   if (typeof window === 'undefined') {
//     return null;
//   }

//   stripeLoadAttempted = true;
  
//   stripePromise = loadStripe(key).catch((error) => {
//     console.error('[Stripe] Failed to load:', error);
//     // Don't reset stripeLoadAttempted to prevent infinite retry loops
//     return null;
//   });

//   return stripePromise;
// };

// // Reset function for testing or error recovery
// export const resetStripe = () => {
//   stripePromise = null;
//   stripeLoadAttempted = false;
// };