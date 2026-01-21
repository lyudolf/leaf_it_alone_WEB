/**
 * SkyboxAI API Integration
 * Generates skybox images from text prompts
 */

const API_KEY = process.env.NEXT_PUBLIC_SKYBOX_API_KEY;
const API_SECRET = process.env.NEXT_PUBLIC_SKYBOX_SECRET;
const API_ENDPOINT = 'https://backend.blockadelabs.com/api/v1'; // SkyboxAI endpoint

export interface SkyboxResult {
    success: boolean;
    skyboxUrl?: string;
    error?: string;
}

export async function generateSkybox(prompt: string): Promise<SkyboxResult> {
    try {
        // Step 1: Submit generation request
        const response = await fetch('/api/generate-skybox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const obfuscatedId = data.obfuscated_id || data.id;

        if (!obfuscatedId) {
            console.error("Failed to parse Skybox ID from response:", data);
            throw new Error("응답에서 Skybox ID를 찾을 수 없습니다.");
        }

        // Step 2: Poll for completion
        const skyboxUrl = await pollForCompletion(obfuscatedId);

        return {
            success: true,
            skyboxUrl,
        };
    } catch (error) {
        console.error('SkyboxAI generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function pollForCompletion(obfuscatedId: string, maxAttempts = 120): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s

        const response = await fetch(`/api/skybox-status?id=${obfuscatedId}`);

        const data = await response.json();
        const request = data.request;

        if (request.status === 'complete') {
            return request.file_url;
        }

        if (request.status === 'error' || request.status === 'abort') {
            throw new Error('Generation failed');
        }
    }

    throw new Error('Generation timeout');
}
