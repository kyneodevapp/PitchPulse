import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

// Use a dummy key if the secret is missing during build time to avoid crashing Next.js data collection
export const stripe = new Stripe(secretKey || "sk_test_dummy", {
    // @ts-ignore - Stripe API versions can sometimes conflict with SDK types during rapid updates
    apiVersion: "2024-12-18.ac",
    typescript: true,
});
