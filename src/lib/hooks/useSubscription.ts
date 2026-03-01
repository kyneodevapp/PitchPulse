"use client";

import { useUser } from "@clerk/nextjs";

export function useSubscription() {
    const { user, isLoaded } = useUser();

    if (!isLoaded || !user) {
        return {
            isLoaded: false,
            isSubscribed: false,
            trialActive: false,
            daysLeft: 0,
            isTrialExpired: false,
        };
    }

    const stripeStatus = user.publicMetadata.stripeStatus as string | undefined;
    const isVip = user.publicMetadata.isVip === true;

    // A user is "subscribed" if they have an active subscription, are trialing, or are a VIP
    const isSubscribed = stripeStatus === "active" || stripeStatus === "trialing" || isVip;

    // Stripe trial logic
    const trialActive = stripeStatus === "trialing";

    // Legacy trial logic (as a fallback or for UI if needed)
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
    const now = Date.now();
    const trialDuration = 7 * 24 * 60 * 60 * 1000;
    const trialEndsAt = createdAt + trialDuration;
    const daysLeft = Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)));

    // A trial is expired if they aren't subscribed/trialing and it's been > 7 days since signup
    // UNLESS they are a VIP.
    const isTrialExpired = !isSubscribed && now > trialEndsAt && !isVip;

    return {
        isLoaded: true,
        isSubscribed,
        trialActive,
        daysLeft,
        isTrialExpired,
        isVip,
    };
}
