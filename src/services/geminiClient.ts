import { GoogleGenAI } from '@google/genai';

export interface GeminiApiOptions {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  customApiKey?: string;
  model?: string;
  images?: string[];
  onStatusUpdate?: (msg: string) => void;
}

export async function callGeminiApi({
  prompt,
  systemInstruction,
  responseMimeType,
  responseSchema,
  customApiKey,
  model = 'gemini-3.6-flash',
  images = [],
  onStatusUpdate,
}: GeminiApiOptions): Promise<string> {
  const apiKey = customApiKey?.trim();
  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key. Bắt buộc người dùng phải nhập Gemini API Key cá nhân trong phần Cài Đặt Hệ Thống.');
  }

  const selectedModel = typeof model === 'string' && model.trim().length > 0 ? model.trim() : 'gemini-3.6-flash';

  // 1. Thử gọi qua Backend Server / Serverless Endpoint (/api/gemini/generate)
  try {
    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        responseMimeType,
        responseSchema,
        customApiKey: apiKey,
        model: selectedModel,
        images,
      }),
    });

    const responseText = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Dữ liệu trả về từ server không phải JSON (ví dụ HTML 404/500 khi deploy tĩnh trên Vercel)
    }

    if (response.ok && data && typeof data.text === 'string') {
      return data.text;
    }

    if (data && data.error) {
      const errMsg = String(data.error);
      if (
        !errMsg.includes('404') &&
        !errMsg.includes('Cannot POST') &&
        !errMsg.includes('Unexpected token') &&
        !errMsg.includes('Failed to fetch')
      ) {
        throw new Error(data.error);
      }
    }
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes('Máy chủ AI') || err.message.includes('API Key') || err.message.includes('quá tải'))
    ) {
      throw err;
    }
    // Nếu không, tự động fallback sang gọi trực tiếp từ client SDK
  }

  // 2. Client-side fallback: Gọi trực tiếp GoogleGenAI SDK với cơ chế Tự động Thử lại (Retry) & Chuyển đổi Model dự phòng khi gặp 503 / High Demand
  const candidateModels = Array.from(
    new Set([selectedModel, 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'])
  );

  let lastError: any = null;

  for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
    const currentModel = candidateModels[mIdx];

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (onStatusUpdate) {
          if (attempt > 1) {
            onStatusUpdate(`Máy chủ bận, đang thử lại lần ${attempt} với model ${currentModel}...`);
          } else if (mIdx > 0) {
            onStatusUpdate(`Đang chuyển sang model dự phòng (${currentModel})...`);
          }
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const config: any = {};
        if (systemInstruction) config.systemInstruction = systemInstruction;
        if (responseMimeType) config.responseMimeType = responseMimeType;
        if (responseSchema) config.responseSchema = responseSchema;

        let contents: any = prompt;
        if (Array.isArray(images) && images.length > 0) {
          const parts: any[] = [];
          for (const imgUrl of images) {
            if (typeof imgUrl === 'string' && imgUrl.startsWith('data:')) {
              const match = imgUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
              if (match) {
                parts.push({
                  inlineData: {
                    mimeType: match[1],
                    data: match[2],
                  },
                });
              }
            }
          }
          parts.push({ text: prompt });
          contents = parts;
        }

        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config,
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (directErr: any) {
        lastError = directErr;
        const errMsg = String(directErr.message || directErr);

        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('overloaded');

        if (isTransient) {
          if (attempt < 3) {
            // Chờ tăng dần 1.5 giây, 3 giây
            await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
            continue;
          } else {
            // Thử model dự phòng tiếp theo
            break;
          }
        }

        if (errMsg.includes('API key not valid') || errMsg.includes('API_KEY_INVALID')) {
          throw new Error('API Key cá nhân không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong phần Cài Đặt Hệ Thống!');
        }
        throw new Error(directErr.message || 'Lỗi khi gọi Gemini API.');
      }
    }
  }

  const rawMsg = String(lastError?.message || '');
  if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand')) {
    throw new Error(
      'Máy chủ Gemini AI hiện tại đang quá tải (503 High Demand). Hệ thống đã tự động thử lại nhiều lần. Vui lòng bấm Sinh đề thi lại sau 5-10 giây!'
    );
  }

  throw new Error(lastError?.message || 'Không thể kết nối tới Gemini AI.');
}

