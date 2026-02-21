import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // @ts-ignore - Stripe API versions can sometimes conflict with SDK types during rapid updates
    apiVersion: "2024-12-18.ac",
    typescript: true,
});
