import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subscriptionId, reason } = body;

        if (!subscriptionId) {
            return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
        }

        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        const secretKey = process.env.PAYPAL_SECRET_KEY;

        if (!clientId || !secretKey) {
            console.error("PayPal credentials are missing from environment variables.");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        // We use Live endpoint since the client id is a Live ID. 
        // If testing in sandbox, you would switch this to api-m.sandbox.paypal.com
        const isLive = clientId.startsWith("Ac") || clientId.startsWith("Ad") || !clientId.startsWith("A"); // Naive check, but we know user is using live
        const baseUrl = "https://api-m.paypal.com";

        // 1. Get access token
        const basicAuth = Buffer.from(`${clientId}:${secretKey}`).toString('base64');
        const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials'
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            console.error("Failed to get PayPal access token:", err);
            return NextResponse.json({ error: "Failed to authenticate with PayPal" }, { status: 500 });
        }

        const { access_token } = await tokenResponse.json();

        // 2. Cancel the subscription
        const cancelResponse = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                reason: reason || "Customer requested cancellation"
            })
        });

        // PayPal returns 204 No Content on successful cancellation
        if (cancelResponse.ok || cancelResponse.status === 204) {
            return NextResponse.json({ success: true });
        } else {
            const errorData = await cancelResponse.json().catch(() => ({}));
            console.error("PayPal cancel response:", cancelResponse.status, errorData);
            return NextResponse.json({ error: errorData.message || "Failed to cancel subscription" }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Error in cancel-subscription route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
