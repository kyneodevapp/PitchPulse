import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe_client";
import { createClerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    const session = event.data.object as any;

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const userId = session.metadata.userId;

        if (!userId) {
            return new NextResponse("User ID not found", { status: 400 });
        }

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                stripeStatus: "active",
                stripeSubscriptionId: subscription.id,
            },
        });
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as { id: string };
        // Search Clerk users for the one with this subscription ID in their metadata.
        // Works well for small-to-medium user counts; migrate to a DB lookup at scale.
        const { data: users } = await clerkClient.users.getUserList({ limit: 500 });
        const user = users.find(
            u => (u.publicMetadata as Record<string, unknown>)?.stripeSubscriptionId === subscription.id
        );
        if (user) {
            await clerkClient.users.updateUserMetadata(user.id, {
                publicMetadata: {
                    stripeStatus: "cancelled",
                    stripeSubscriptionId: null,
                },
            });
        }
    }

    return new NextResponse(null, { status: 200 });
}
