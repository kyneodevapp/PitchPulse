import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe_client";
import { createClerkClient } from "@clerk/nextjs/server";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 1 });
    }

    const session = event.data.object as any;

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const userId = session.metadata.userId;

        if (!userId) {
            return new NextResponse("User ID not found", { status: 1 });
        }

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                stripeStatus: "active",
                stripeSubscriptionId: subscription.id,
            },
        });
    }

    if (event.type === "customer.subscription.deleted") {
        // Find the user with this subscription ID (this would require a DB lookup in a larger app, 
        // but here we can try to find the Clerk user if we stored it).
        // For now, let's assume the user cancels and we sync that.
        // In a surgical implementation, we'd query users by metadata or use a database.
    }

    return new NextResponse(null, { status: 200 });
}
