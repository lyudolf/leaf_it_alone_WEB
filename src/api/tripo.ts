/**
 * Tripo API Integration
 * Generates 3D models from text prompts
 */

// Tripo API Logic
const API_KEY = process.env.NEXT_PUBLIC_TRIPO_API_KEY;

export interface GenerationResult {
    success: boolean;
    modelUrl?: string;
    error?: string;
}

export async function generateModel(prompt: string, onProgress?: (progress: number) => void): Promise<GenerationResult> {
    try {
        // Step 1: Submit generation request
        const response = await fetch('/api/generate-model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
            }),
        });

        // Debug Wrapper Handling
        const debugResult = await response.json();

        if (debugResult.error) {
            throw new Error(debugResult.error);
        }

        const tripoStatus = debugResult.httpStatus;
        const tripoData = debugResult.tripoResponse;

        // 1. HTTP Error from Tripo
        if (tripoStatus !== 200) {
            const errorMsg = JSON.stringify(tripoData);
            throw new Error(`Tripo HTTP ${tripoStatus}: ${errorMsg}`);
        }

        // 2. Logical Error from Tripo (code != 0)
        if (tripoData.code !== undefined && tripoData.code !== 0) {
            throw new Error(`Tripo Error ${tripoData.code}: ${tripoData.message} (${tripoData.suggestion || ''})`);
        }

        const jobId = tripoData.data?.task_id;

        if (!jobId) {
            console.error("Failed to parse Tripo Task ID:", tripoData);
            throw new Error("응답에서 작업 ID를 찾을 수 없습니다. (응답 형식 오류)");
        }

        // Step 2: Poll for completion
        const modelUrl = await pollForCompletion(jobId, 120, onProgress);

        return {
            success: true,
            modelUrl,
        };
    } catch (error) {
        console.error('Tripo generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function pollForCompletion(jobId: string, maxAttempts = 120, onProgress?: (progress: number) => void): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s

        const response = await fetch(`/api/model-status?id=${jobId}`);
        const data = await response.json();

        // Check for server-side errors in status check
        if (data.error) {
            console.error("Status check API error:", data.error);
            throw new Error(`Status Check Error: ${data.error}`);
        }

        const taskData = data.data;

        if (!taskData) {
            console.warn("Unexpected status response (no data):", data);
            if (data.code !== undefined && data.code !== 0) {
                throw new Error(`Tripo Status Error ${data.code}: ${data.message}`);
            }
            continue;
        }

        console.log(`Polling status: ${taskData.status}, progress: ${taskData.progress}%`);

        // Report progress
        if (onProgress && typeof taskData.progress === 'number') {
            onProgress(taskData.progress);
        }

        if (taskData.status === 'success') {
            // Check for output model URL
            const modelUrl = taskData.output?.model || taskData.output?.base_model || taskData.output?.pbr_model;
            if (!modelUrl) {
                throw new Error("Generation success but no model URL found in output");
            }
            // Use Proxy to bypass CORS issues with Tripo CDN
            return `/api/proxy-model?url=${encodeURIComponent(modelUrl)}`;
        }

        if (taskData.status === 'failed' || taskData.status === 'cancelled' || taskData.status === 'banned' || taskData.status === 'expired') {
            throw new Error(`Tripo generation ${taskData.status}`);
        }

        // If queued or running, continue polling
    }

    throw new Error('Generation timeout');
}
