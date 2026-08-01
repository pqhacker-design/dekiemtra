import { ExamMetadata, ExamPackage } from '../types';
import { PromptEngine } from './promptEngine';
import { ShuffleEngine } from './shuffleEngine';
import { ValidationEngine } from './validationEngine';
import { StorageEngine } from './storageEngine';

export class GeminiService {
  /**
   * Gọi backend API để sinh Đề kiểm tra, Ma trận, Bảng đặc tả và Đáp án
   */
  static async generateExamPackage(
    metadata: ExamMetadata,
    onProgress?: (message: string) => void
  ): Promise<ExamPackage> {
    if (onProgress) onProgress('Đang tạo Prompt chuẩn Công văn 7991/BGDĐT...');

    const systemInstruction = PromptEngine.getSystemInstruction();
    const prompt = PromptEngine.buildGenerationPrompt(metadata);
    const settings = StorageEngine.getSettings();
    const customApiKey = settings.customApiKey;
    const selectedModel = settings.selectedModel || 'gemini-3.6-flash';

    if (!customApiKey || customApiKey.trim().length === 0) {
      throw new Error(
        'Bắt buộc người dùng phải nhập Gemini API Key cá nhân! Vui lòng chuyển sang tab "Cài Đặt Hệ Thống" (biểu tượng bánh răng) để dán API Key của bạn.'
      );
    }

    if (onProgress) onProgress(`Đang gửi yêu cầu tới Gemini AI (${selectedModel})...`);

    const response = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        responseMimeType: 'application/json',
        customApiKey,
        model: selectedModel,
        images: metadata.referenceImages || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Lỗi máy chủ (${response.status}): Không thể nhận kết quả từ Gemini API.`
      );
    }

    const data = await response.json();
    const rawText = data.text;

    if (!rawText) {
      throw new Error('Gemini API không phản hồi dữ liệu.');
    }

    if (onProgress) onProgress('Đang thẩm định và kiểm tra cấu trúc ma trận, câu hỏi...');

    const validationResult = ValidationEngine.validateAndRepair(rawText, metadata);

    if (!validationResult.isValid) {
      throw new Error(
        `Dữ liệu từ AI chưa chuẩn hóa: ${validationResult.errors.join('; ')}`
      );
    }

    if (onProgress)
      onProgress(`Đang xáo trộn và sinh ${metadata.codeCount || 1} mã đề kiểm tra...`);

    // Xáo trộn và sinh nhiều mã đề (101, 102, 103...)
    const { exams, answerKeys } = ShuffleEngine.generateMultipleExamCodes(
      validationResult.questions,
      metadata.codeCount || 1
    );

    if (onProgress) onProgress('Đã hoàn tất khởi tạo gói đề thi!');

    const examPackage: ExamPackage = {
      id: `exam-pack-${Date.now()}`,
      createdAt: new Date().toISOString(),
      metadata,
      matrix: validationResult.matrix,
      specification: validationResult.specification,
      exams,
      answerKeys,
    };

    return examPackage;
  }

  static async generateExam(
    metadata: ExamMetadata,
    onProgress?: (message: string) => void
  ): Promise<ExamPackage> {
    return this.generateExamPackage(metadata, onProgress);
  }
}
