import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe_client";

export const dynamic = "force-dynamic";

export async function GET() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
        payment_method_types: ["card"],
        mode: "subscription",
        billing_address_collection: "auto",
        customer_email: user.emailAddresses[0].emailAddress,
        line_items: [
            {
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            },
        ],
        metadata: {
            userId,
        },
        subscription_data: {
            trial_period_days: 7,
        },
    });

    return NextResponse.redirect(stripeSession.url!);
}
