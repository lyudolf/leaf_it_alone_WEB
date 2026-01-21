import { NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_SKYBOX_API_KEY;
const API_ENDPOINT = 'https://backend.blockadelabs.com/api/v1/skybox';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!API_KEY) {
            return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
        }

        // Step 1: Generate Request
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                skybox_style_id: 10, // Realistic style (example)
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Skybox API Error: ${response.status} - ${errorText}` }, { status: response.status });
        }

        const data = await response.json();

        // In a real proxy, we might poll here or return the ID to client to poll.
        // Let's return the ID to client and let client poll via another endpoint?
        // Or poll here? Polling here might timeout in Serverless functions (10s limit often).
        // Better to return the ID and let client poll status via proxy.

        return NextResponse.json(data);

    } catch (error) {
        console.error('Skybox Generate Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
