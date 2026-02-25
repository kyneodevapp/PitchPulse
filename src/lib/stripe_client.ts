import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

// During Next.js build time STRIPE_SECRET_KEY may not be present.
// The placeholder prevents build-time crashes; real API calls will fail
// clearly at runtime if the key is missing from the environment.
export const stripe = new Stripe(secretKey ?? "sk_placeholder_missing_STRIPE_SECRET_KEY", {
    apiVersion: "2024-12-18.ac" as Stripe.LatestApiVersion,
    typescript: true,
});
