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

    // Now all authenticated users are considered "subscribed"
    return {
        isLoaded: true,
        isSubscribed: true,
        trialActive: false,
        daysLeft: 0,
        isTrialExpired: false,
        isVip: user.publicMetadata.isVip === true,
    };
}
