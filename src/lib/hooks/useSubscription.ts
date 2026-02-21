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

    const stripeStatus = user.publicMetadata.stripeStatus as string;
    const isSubscribed = stripeStatus === "active";

    // 7-day trial logic
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
    const now = Date.now();
    const trialDuration = 7 * 24 * 60 * 60 * 1000;
    const trialEndsAt = createdAt + trialDuration;

    const trialActive = now < trialEndsAt;
    const daysLeft = Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)));
    const isTrialExpired = !trialActive && !isSubscribed;

    return {
        isLoaded: true,
        isSubscribed,
        trialActive,
        daysLeft,
        isTrialExpired,
    };
}
