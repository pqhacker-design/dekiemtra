import { ExamMetadata, MatrixRow, Question, SpecRow } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  matrix: MatrixRow[];
  specification: SpecRow[];
  questions: Question[];
}

export class ValidationEngine {
  /**
   * Phân tích và kiểm tra tính hợp lệ của JSON do AI trả về
   */
  static validateAndRepair(
    rawText: string,
    metadata: ExamMetadata
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: any = null;

    try {
      // Tìm khối JSON từ response text
      let jsonStr = rawText.trim();
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      parsed = JSON.parse(jsonStr);
    } catch (e: any) {
      errors.push(`Dữ liệu AI trả về không phải định dạng JSON hợp lệ: ${e.message}`);
      return {
        isValid: false,
        errors,
        warnings,
        matrix: [],
        specification: [],
        questions: [],
      };
    }

    const rawMatrix = Array.isArray(parsed.matrix) ? parsed.matrix : [];
    const rawSpec = Array.isArray(parsed.specification)
      ? parsed.specification
      : [];
    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];

    // 1. Kiểm tra danh sách câu hỏi
    const repairedQuestions: Question[] = [];
    const { part1_MCQSingle, part2_MCQTrueFalse, part3_MCQShort, part4_Essay } =
      metadata.questionCounts;

    const part1Questions = rawQuestions.filter((q) => q.partType === 'PART1');
    const part2Questions = rawQuestions.filter((q) => q.partType === 'PART2');
    const part3Questions = rawQuestions.filter((q) => q.partType === 'PART3');
    const part4Questions = rawQuestions.filter((q) => q.partType === 'PART4');

    if (part1Questions.length !== part1_MCQSingle) {
      warnings.push(
        `Số câu Phần I khác yêu cầu (Cần: ${part1_MCQSingle}, Nhận được: ${part1Questions.length}).`
      );
    }
    if (part2Questions.length !== part2_MCQTrueFalse) {
      warnings.push(
        `Số câu Phần II khác yêu cầu (Cần: ${part2_MCQTrueFalse}, Nhận được: ${part2Questions.length}).`
      );
    }
    if (part3Questions.length !== part3_MCQShort) {
      warnings.push(
        `Số câu Phần III khác yêu cầu (Cần: ${part3_MCQShort}, Nhận được: ${part3Questions.length}).`
      );
    }
    if (part4Questions.length !== part4_Essay) {
      warnings.push(
        `Số câu Phần IV khác yêu cầu (Cần: ${part4_Essay}, Nhận được: ${part4Questions.length}).`
      );
    }

    // Đánh số lại câu hỏi theo từng phần
    let p1Num = 1;
    let p2Num = 1;
    let p3Num = 1;
    let p4Num = 1;

    for (const q of rawQuestions) {
      const partType = q.partType || 'PART1';
      let num = p1Num++;
      if (partType === 'PART2') num = p2Num++;
      else if (partType === 'PART3') num = p3Num++;
      else if (partType === 'PART4') num = p4Num++;

      const validQuestion: Question = {
        id: q.id || `gen-q-${Math.random().toString(36).substring(2, 9)}`,
        partType: partType,
        partTitle:
          q.partTitle ||
          (partType === 'PART1'
            ? 'PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn'
            : partType === 'PART2'
            ? 'PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai'
            : partType === 'PART3'
            ? 'PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn'
            : 'PHẦN IV. Tự luận'),
        number: num,
        content: q.content || 'Nội dung câu hỏi chưa cập nhật.',
        cognitiveLevel: q.cognitiveLevel || 'REMEMBER',
        points:
          partType === 'PART1'
            ? metadata.questionCounts.part1_PointsPerQuestion ?? (typeof q.points === 'number' ? q.points : 0.25)
            : partType === 'PART2'
            ? metadata.questionCounts.part2_PointsPerQuestion ?? (typeof q.points === 'number' ? q.points : 1.0)
            : partType === 'PART3'
            ? metadata.questionCounts.part3_PointsPerQuestion ?? (typeof q.points === 'number' ? q.points : 0.25)
            : partType === 'PART4'
            ? (q.cognitiveLevel === 'ADVANCED' || q.cognitiveLevel === 'VDC'
                ? metadata.questionCounts.part4_AdvancedPoints ?? (typeof q.points === 'number' ? q.points : 1.0)
                : (typeof q.points === 'number' && q.points > 0 ? q.points : 1.5))
            : 0.25,
        topic: q.topic || metadata.chapterTitle || 'Kiến thức chung',
        explanation: q.explanation || '',
      };

      if (partType === 'PART1') {
        validQuestion.options = Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : [
              { key: 'A', content: q.options?.[0]?.content || 'Phương án A' },
              { key: 'B', content: q.options?.[1]?.content || 'Phương án B' },
              { key: 'C', content: q.options?.[2]?.content || 'Phương án C' },
              { key: 'D', content: q.options?.[3]?.content || 'Phương án D' },
            ];
        validQuestion.correctOption = q.correctOption || 'A';
      } else if (partType === 'PART2') {
        validQuestion.trueFalseStatements =
          Array.isArray(q.trueFalseStatements) && q.trueFalseStatements.length === 4
            ? q.trueFalseStatements
            : [
                { key: 'a', content: 'Mô tả ý a', isCorrect: true },
                { key: 'b', content: 'Mô tả ý b', isCorrect: false },
                { key: 'c', content: 'Mô tả ý c', isCorrect: true },
                { key: 'd', content: 'Mô tả ý d', isCorrect: false },
              ];
      } else if (partType === 'PART3') {
        validQuestion.shortAnswer = q.shortAnswer || '1';
      } else if (partType === 'PART4') {
        validQuestion.essayAnswerGuide = q.essayAnswerGuide || 'Hướng dẫn chấm...';
        validQuestion.rubric = Array.isArray(q.rubric) ? q.rubric : [];
      }

      repairedQuestions.push(validQuestion);
    }

    // Repair Matrix if needed
    const repairedMatrix: MatrixRow[] = rawMatrix.map((m: any, idx: number) => ({
      stt: m.stt || idx + 1,
      topic: m.topic || metadata.chapterTitle || 'Chủ đề chính',
      subTopic: m.subTopic || 'Đơn vị kiến thức',
      part1: m.part1 || { remember: 1, understand: 1, apply: 0, advanced: 0 },
      part2: m.part2 || { remember: 0, understand: 1, apply: 0, advanced: 0 },
      part3: m.part3 || { remember: 0, understand: 0, apply: 1, advanced: 0 },
      part4: m.part4 || { remember: 0, understand: 0, apply: 0, advanced: 1 },
      totalQuestions: typeof m.totalQuestions === 'number' ? m.totalQuestions : 3,
      totalPoints: typeof m.totalPoints === 'number' ? m.totalPoints : 2.0,
      percentage: typeof m.percentage === 'number' ? m.percentage : 20,
    }));

    // Repair Specification if needed
    const repairedSpec: SpecRow[] = rawSpec.map((s: any, idx: number) => ({
      stt: s.stt || idx + 1,
      topic: s.topic || metadata.chapterTitle || 'Chủ đề chính',
      subTopic: s.subTopic || 'Đơn vị kiến thức',
      requirements:
        s.requirements ||
        'Nhận biết được kiến thức cơ bản, thông hiểu bản chất và vận dụng giải bài tập.',
      part1: s.part1 || { remember: 1, understand: 1, apply: 0, advanced: 0 },
      part2: s.part2 || { remember: 0, understand: 1, apply: 0, advanced: 0 },
      part3: s.part3 || { remember: 0, understand: 0, apply: 1, advanced: 0 },
      part4: s.part4 || { remember: 0, understand: 0, apply: 0, advanced: 1 },
      totalPoints: typeof s.totalPoints === 'number' ? s.totalPoints : 2.0,
    }));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      matrix: repairedMatrix,
      specification: repairedSpec,
      questions: repairedQuestions,
    };
  }
}
