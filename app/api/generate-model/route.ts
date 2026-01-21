import { NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_TRIPO_API_KEY;
const API_ENDPOINT = 'https://api.tripo3d.ai/v2/openapi/task';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt } = body;

        // Check if user set the key
        if (!API_KEY || API_KEY === 'INSERT_YOUR_TRIPO_KEY_HERE') {
            return NextResponse.json({ error: 'Tripo API Key가 설정되지 않았습니다. .env.local 파일을 확인해주세요.' }, { status: 500 });
        }

        // Optimized payload for game assets:
        // - face_limit: 1000 (Low poly for better performance when instanced)
        // - model_version: Explicitly set to ensure compatibility
        const bodyPayload = {
            type: 'text_to_model',
            prompt: prompt,
            model_version: "v2.5-20250123",
            face_limit: 1000,
            texture_quality: 'standard',
        };

        console.log('Sending request to Tripo API:', API_ENDPOINT, JSON.stringify(bodyPayload));

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyPayload),
        });

        // Response Handling with Debug Wrapper
        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await response.json();
        } else {
            responseData = { rawText: await response.text() };
        }

        console.log('Tripo Response:', response.status, responseData);

        return NextResponse.json({
            httpStatus: response.status,
            tripoResponse: responseData
        });

    } catch (error: any) {
        console.error('Tripo Generate Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
