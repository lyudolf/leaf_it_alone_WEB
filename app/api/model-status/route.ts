import { NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_TRIPO_API_KEY;
const API_ENDPOINT = 'https://api.tripo3d.ai/v2/openapi/task'; // Tripo V2 Status Endpoint

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !API_KEY) {
        return NextResponse.json({ error: 'Missing ID or API Key' }, { status: 400 });
    }

    try {
        // console.log(`Checking Tripo status for task: ${id}`);

        const response = await fetch(`${API_ENDPOINT}/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Status check failed: ${response.status} - ${errorText}`);
            return NextResponse.json({ error: `Status Check Failed: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (err: any) {
        console.error(`Status check error:`, err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
