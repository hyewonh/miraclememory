import { NextResponse } from 'next/server';

// This endpoint checks a PayPal subscription status and returns it
// The client (profile page) can use this to keep Firestore in sync
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subscriptionId } = body;

        if (!subscriptionId) {
            return NextResponse.json({ status: 'unknown' });
        }

        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        const secretKey = process.env.PAYPAL_SECRET_KEY;

        if (!clientId || !secretKey) {
            return NextResponse.json({ status: 'unknown' });
        }

        const baseUrl = "https://api-m.paypal.com";

        // Get access token
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
            return NextResponse.json({ status: 'unknown' });
        }

        const { access_token } = await tokenResponse.json();

        // Get subscription status
        const statusResponse = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            }
        });

        if (!statusResponse.ok) {
            return NextResponse.json({ status: 'unknown' });
        }

        const subData = await statusResponse.json();
        // Map PayPal statuses to our internal statuses
        const statusMap: Record<string, string> = {
            'ACTIVE': 'active',
            'CANCELLED': 'canceled',
            'EXPIRED': 'canceled',
            'SUSPENDED': 'canceled',
        };

        const mappedStatus = statusMap[subData.status] || 'unknown';
        return NextResponse.json({ status: mappedStatus, paypalStatus: subData.status });

    } catch (error: any) {
        console.error("Error syncing subscription status:", error);
        return NextResponse.json({ status: 'unknown' });
    }
}
