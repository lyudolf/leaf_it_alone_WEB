import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    try {
        const response = await fetch(targetUrl);

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch resource: ${response.status}` }, { status: response.status });
        }

        const blob = await response.blob();
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(blob, {
            status: 200,
            headers: headers,
        });

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
    }
}
