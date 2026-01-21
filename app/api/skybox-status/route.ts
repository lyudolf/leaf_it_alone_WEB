import { NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_SKYBOX_API_KEY;
const API_ENDPOINT = 'https://backend.blockadelabs.com/api/v1/imagine/requests/obfuscated-id';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !API_KEY) {
        return NextResponse.json({ error: 'Missing ID or API Key' }, { status: 400 });
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/${id}`, {
            headers: {
                'x-api-key': API_KEY,
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch status' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
