import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { registerExamRoutes } from './server/api';

const app = express();
app.use(express.json({ limit: '20mb' }));

// Register Online Exam System REST API Routes
registerExamRoutes(app);

const PORT = 3000;

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Gemini Generation Route
app.post('/api/gemini/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, responseMimeType, responseSchema, customApiKey, images, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Nội dung Yêu cầu (prompt) không được để trống.' });
    }

    const selectedModel = typeof model === 'string' && model.trim().length > 0 ? model.trim() : 'gemini-3.6-flash';

    const apiKey = (typeof customApiKey === 'string' && customApiKey.trim().length > 0)
      ? customApiKey.trim()
      : (req.headers['x-custom-api-key'] as string || '').trim();

    if (!apiKey) {
      return res.status(400).json({
        error: 'Chưa cấu hình API Key. Bắt buộc người dùng phải nhập Gemini API Key cá nhân trong phần Cài Đặt Hệ Thống.',
      });
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
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }
    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

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

    const text = response.text || '';
    return res.json({ text });
  } catch (error: any) {
    console.error('Lỗi khi gọi Gemini API:', error);
    return res.status(500).json({
      error: error.message || 'Đã xảy ra lỗi khi tạo dữ liệu từ Gemini AI.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

startServer();
