import { GoogleGenAI } from '@google/genai';

export interface GeminiApiOptions {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  customApiKey?: string;
  model?: string;
  images?: string[];
}

export async function callGeminiApi({
  prompt,
  systemInstruction,
  responseMimeType,
  responseSchema,
  customApiKey,
  model = 'gemini-3.6-flash',
  images = [],
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
      throw new Error(data.error);
    }
  } catch (err: any) {
    // Nếu là lỗi có cấu trúc từ backend trả về thì ném lỗi
    if (
      err.message &&
      !err.message.includes('Unexpected token') &&
      !err.message.includes('JSON') &&
      !err.message.includes('Failed to fetch')
    ) {
      throw err;
    }
    // Nếu không (do 404 HTML trên Vercel / route không tồn tại), tự động fallback sang gọi trực tiếp từ client SDK
  }

  // 2. Client-side fallback: Gọi trực tiếp GoogleGenAI SDK từ trình duyệt (Tương thích tốt nhất cho Vercel/Netlify SPA)
  try {
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
      model: selectedModel,
      contents,
      config,
    });

    return response.text || '';
  } catch (directErr: any) {
    throw new Error(directErr.message || 'Không thể xác thực API Key hoặc gọi Gemini API.');
  }
}
