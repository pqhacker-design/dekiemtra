/**
 * Các Kiểu dữ liệu Chuẩn cho Hệ thống AI Test Generator Pro
 * Theo định hướng Công văn 7991/BGDĐT cho THCS và THPT
 */

export type SubjectType =
  | 'Toán'
  | 'Ngữ văn'
  | 'Tiếng Anh'
  | 'KHTN'
  | 'Lịch sử và Địa lí'
  | 'GDCD / GDKT&PL'
  | 'Tin học'
  | 'Công nghệ'
  | 'Mỹ thuật'
  | 'Âm nhạc'
  | 'Giáo dục thể chất'
  | 'Khác';

export type CurriculumType =
  | 'Kết nối tri thức với cuộc sống'
  | 'Chân trời sáng tạo'
  | 'Cánh Diều'
  | 'Chương trình GDPT 2018 khác';

export type ExamMode = 'MCQ_ESSAY' | 'MCQ_ONLY' | 'ESSAY_ONLY';

export type PartType = 'PART1' | 'PART2' | 'PART3' | 'PART4';

export type CognitiveLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ADVANCED';

export function getCognitiveTag(level?: CognitiveLevel | string, partType?: PartType | string): string {
  let code = 'NB';
  if (level) {
    const l = level.toUpperCase();
    if (l === 'REMEMBER' || l === 'NB') code = 'NB';
    else if (l === 'UNDERSTAND' || l === 'TH') code = 'TH';
    else if (l === 'APPLY' || l === 'VD') code = 'VD';
    else if (l === 'ADVANCED' || l === 'VDC') code = 'VDC';
  }
  const isEssay = partType === 'PART4' || partType === 'ESSAY';
  const typeCode = isEssay ? 'TL' : 'TN';
  return `[${code}_${typeCode}]`;
}

export function getCognitiveLabel(level?: CognitiveLevel | string): string {
  if (!level) return 'Nhận biết';
  const l = level.toUpperCase();
  if (l === 'REMEMBER' || l === 'NB') return 'Nhận biết';
  if (l === 'UNDERSTAND' || l === 'TH') return 'Thông hiểu';
  if (l === 'APPLY' || l === 'VD') return 'Vận dụng';
  if (l === 'ADVANCED' || l === 'VDC') return 'Vận dụng cao';
  return 'Nhận biết';
}

export interface CognitiveRatio {
  remember: number;     // % Nhận biết (e.g., 40)
  understand: number;   // % Thông hiểu (e.g., 30)
  apply: number;        // % Vận dụng (e.g., 20)
  advanced: number;     // % Vận dụng cao (e.g., 10)
}

export interface QuestionCounts {
  part1_MCQSingle: number;            // Phần I: Trắc nghiệm 4 lựa chọn
  part1_PointsPerQuestion?: number;   // Điểm mỗi câu Phần I (Mặc định: 0.25đ)
  part2_MCQTrueFalse: number;         // Phần II: Trắc nghiệm Đúng/Sai (mỗi câu 4 ý a,b,c,d)
  part2_PointsPerQuestion?: number;   // Điểm mỗi câu Phần II (Mặc định: 1.0đ)
  part3_MCQShort: number;             // Phần III: Trắc nghiệm Trả lời ngắn
  part3_PointsPerQuestion?: number;   // Lựa chọn điểm mỗi câu trả lời ngắn (0.25, 0.5, 0.75, 1.0...)
  part4_Essay: number;                // Phần IV: Tự luận
  part4_ApplyCount?: number;          // Số câu Tự luận Vận dụng (VD)
  part4_ApplyPoints?: number;         // Điểm mỗi câu Tự luận Vận dụng (VD)
  part4_AdvancedCount?: number;       // Số câu Tự luận Vận dụng cao (VDC)
  part4_AdvancedPoints?: number;      // Điểm mỗi câu Tự luận Vận dụng cao (VDC)
  part4_PointsPerQuestion?: number;   // Điểm trung bình / mặc định Tự luận
}

export function calculateExamScores(qc: QuestionCounts) {
  const p1Pts = qc.part1_PointsPerQuestion ?? 0.25;
  const p2Pts = qc.part2_PointsPerQuestion ?? 1.0;
  const p3Pts = qc.part3_PointsPerQuestion ?? 0.25;

  const part1Score = (qc.part1_MCQSingle || 0) * p1Pts;
  const part2Score = (qc.part2_MCQTrueFalse || 0) * p2Pts;
  const part3Score = (qc.part3_MCQShort || 0) * p3Pts;
  const mcqTotal = part1Score + part2Score + part3Score;

  const essayTotal = qc.part4_Essay || 0;
  let applyCount = qc.part4_ApplyCount;
  let advCount = qc.part4_AdvancedCount;

  if (
    applyCount === undefined ||
    advCount === undefined ||
    applyCount + advCount !== essayTotal
  ) {
    advCount = Math.floor(essayTotal / 2);
    applyCount = essayTotal - advCount;
  }

  const advPts = qc.part4_AdvancedPoints ?? 1.0;
  const totalAdvScore = advCount * advPts;

  // Remaining score for Apply (Vận dụng) questions to hit 10.0 total score
  const remainingForApply = Math.max(0, 10.0 - mcqTotal - totalAdvScore);

  let applyPts = 0;
  if (applyCount > 0) {
    applyPts = Math.round((remainingForApply / applyCount) * 100) / 100;
  }

  let part4Score = 0;
  if (essayTotal > 0) {
    part4Score = applyCount * applyPts + totalAdvScore;
  }

  const totalScore =
    Math.round(
      (part1Score + part2Score + part3Score + part4Score) * 100
    ) / 100;

  return {
    part1Score: Math.round(part1Score * 100) / 100,
    part2Score: Math.round(part2Score * 100) / 100,
    part3Score: Math.round(part3Score * 100) / 100,
    part4Score: Math.round(part4Score * 100) / 100,
    applyCount,
    advCount,
    applyPts,
    advPts,
    totalAdvScore: Math.round(totalAdvScore * 100) / 100,
    remainingForApply: Math.round(remainingForApply * 100) / 100,
    p1Pts,
    p2Pts,
    p3Pts,
    totalScore,
  };
}

export interface ExamMetadata {
  schoolName: string;
  departmentName: string;
  subject: SubjectType;
  grade: string;             // Khối 6 -> Khối 12
  className: string;         // e.g. 10A1
  semester: string;          // Học kỳ I, Học kỳ II
  schoolYear: string;        // e.g. 2025 - 2026
  examTitle: string;         // e.g. Kiểm tra Giữa Học kỳ I
  chapterTitle: string;      // Tên chương / Chủ đề / Mạch kiến thức
  durationMinutes: number;   // e.g. 45
  totalPoints: number;       // e.g. 10
  curriculum: CurriculumType;
  examMode: ExamMode;
  questionCounts: QuestionCounts;
  cognitiveRatio: CognitiveRatio;
  codeCount: number;         // Số mã đề (1, 2, 4, 6, 8, 10, 20, 50, 100)
  referenceContext?: string; // Giới hạn kiến thức / Mô tả nội dung bài học chi tiết từ SGK
  referenceImages?: string[]; // Danh sách ảnh đính kèm (SGK, trang sách, ảnh mục lục, v.v...)
}

export interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  content: string;
}

export interface TrueFalseStatement {
  key: 'a' | 'b' | 'c' | 'd';
  content: string;
  isCorrect: boolean;
}

export interface RubricItem {
  criteria: string;
  points: number;
  description: string;
}

export interface Question {
  id: string;
  partType: PartType;
  partTitle: string;
  number: number;
  content: string;
  cognitiveLevel: CognitiveLevel;
  points: number;
  topic: string;
  
  // Dành cho Phần I (TN Nhiều lựa chọn)
  options?: MCQOption[];
  correctOption?: 'A' | 'B' | 'C' | 'D' | string;
  
  // Dành cho Phần II (TN Đúng/Sai)
  trueFalseStatements?: TrueFalseStatement[];
  
  // Dành cho Phần III (TN Trả lời ngắn)
  shortAnswer?: string;
  
  // Dành cho Phần IV (Tự luận)
  essayAnswerGuide?: string;
  rubric?: RubricItem[];
  
  // Giải thích chi tiết & Sơ đồ hình vẽ / đồ thị
  explanation?: string;
  svgDiagram?: string;
  solutionDiagramSvg?: string;
}

export interface CognitiveBreakdown {
  remember: number;
  understand: number;
  apply: number;
  advanced: number;
}

export interface MatrixRow {
  stt: number;
  topic: string;             // Mạch nội dung / Chủ đề
  subTopic: string;          // Đơn vị kiến thức
  part1: CognitiveBreakdown; // Nhiều lựa chọn (số câu)
  part2: CognitiveBreakdown; // Đúng/Sai (số lệnh hỏi / câu)
  part3: CognitiveBreakdown; // Trả lời ngắn (số câu)
  part4: CognitiveBreakdown; // Tự luận (số câu)
  totalQuestions: number;
  totalPoints: number;
  percentage: number;
}

export interface SpecRow {
  stt: number;
  topic: string;
  subTopic: string;
  requirements: string;      // Yêu cầu cần đạt (YCCĐ)
  part1: CognitiveBreakdown;
  part2: CognitiveBreakdown;
  part3: CognitiveBreakdown;
  part4: CognitiveBreakdown;
  totalPoints: number;
}

export interface CodeExam {
  code: string;
  questions: Question[];
}

export interface Part1Answer {
  questionNumber: number;
  correctOption: string;
  points: number;
}

export interface Part2Answer {
  questionNumber: number;
  statements: { key: string; isCorrect: boolean }[];
  points: number;
}

export interface Part3Answer {
  questionNumber: number;
  shortAnswer: string;
  points: number;
}

export interface Part4Answer {
  questionNumber: number;
  essayAnswerGuide: string;
  points: number;
  rubric?: RubricItem[];
}

export interface ExamAnswerKey {
  code: string;
  part1Answers: Part1Answer[];
  part2Answers: Part2Answer[];
  part3Answers: Part3Answer[];
  part4Answers: Part4Answer[];
}

export interface ExamPackage {
  id: string;
  createdAt: string;
  metadata: ExamMetadata;
  matrix: MatrixRow[];
  specification: SpecRow[];
  exams: CodeExam[];
  answerKeys: ExamAnswerKey[];
}

export interface QuestionBankItem extends Question {
  subject: SubjectType;
  grade: string;
  chapter: string;
  curriculum: CurriculumType;
  createdDate: string;
  sourceExamId?: string;
}

export interface AppSettings {
  defaultSchoolName: string;
  defaultDepartmentName: string;
  defaultTeacherName: string;
  customApiKey?: string;
  selectedModel?: string;
  theme: 'light' | 'dark';
  saveExamHistory: boolean;
  autoSaveToBank: boolean;
}

/**
 * Lấy thống kê chi tiết Số câu / Dạng câu (TN, Đ/S, TLN, TL) kèm danh sách số thứ tự câu hỏi cho Bảng đặc tả
 */
export function getSpecRowQuestionDetails(
  row: SpecRow,
  rowIdx: number,
  allRows: SpecRow[],
  questions: Question[] = []
): string[] {
  const parts: Array<{
    key: 'part1' | 'part2' | 'part3' | 'part4';
    partType: 'PART1' | 'PART2' | 'PART3' | 'PART4';
    label: string;
  }> = [
    { key: 'part1', partType: 'PART1', label: 'TN' },
    { key: 'part2', partType: 'PART2', label: 'Đ/S' },
    { key: 'part3', partType: 'PART3', label: 'TLN' },
    { key: 'part4', partType: 'PART4', label: 'TL' },
  ];

  const result: string[] = [];

  parts.forEach(({ key, partType, label }) => {
    const cognitiveBreakdown = row[key];
    if (!cognitiveBreakdown) return;

    const count =
      Number(cognitiveBreakdown.remember || 0) +
      Number(cognitiveBreakdown.understand || 0) +
      Number(cognitiveBreakdown.apply || 0) +
      Number(cognitiveBreakdown.advanced || 0);

    if (count <= 0) return;

    // Lấy tất cả các câu hỏi thuộc partType này trong bài thi
    const partQuestions = questions.filter((q) => q.partType === partType);

    let nums: number[] = [];

    // 1. Thử lọc theo topic / subTopic nếu có
    if (partQuestions.length > 0 && (row.topic || row.subTopic)) {
      const rowTopicClean = (row.topic || '').trim().toLowerCase();
      const rowSubClean = (row.subTopic || '').trim().toLowerCase();

      const matchedQs = partQuestions.filter((q) => {
        if (!q.topic) return false;
        const qTopicClean = q.topic.trim().toLowerCase();
        return (
          (rowTopicClean && (qTopicClean.includes(rowTopicClean) || rowTopicClean.includes(qTopicClean))) ||
          (rowSubClean && (qTopicClean.includes(rowSubClean) || rowSubClean.includes(qTopicClean)))
        );
      });

      if (matchedQs.length > 0) {
        nums = matchedQs.map((q) => q.number);
      }
    }

    // 2. Nếu không khớp bằng string topic, dùng phân bổ thứ tự (Sequential range)
    if (nums.length === 0) {
      let startIndex = 0;
      for (let i = 0; i < rowIdx; i++) {
        const prevBk = allRows[i]?.[key];
        if (prevBk) {
          startIndex +=
            Number(prevBk.remember || 0) +
            Number(prevBk.understand || 0) +
            Number(prevBk.apply || 0) +
            Number(prevBk.advanced || 0);
        }
      }

      if (partQuestions.length >= startIndex + count) {
        nums = partQuestions.slice(startIndex, startIndex + count).map((q) => q.number);
      } else {
        nums = Array.from({ length: count }, (_, i) => startIndex + 1 + i);
      }
    }

    const numsStr = nums.length > 0 ? ` (${nums.join(', ')})` : '';
    result.push(`${label}: ${count} câu${numsStr}`);
  });

  return result;
}

export interface StudentItem {
  id: string;
  classId: string;
  className: string;
  sbd: string;
  name: string;
  gender?: string;
  dob?: string;
  notes?: string;
  createdAt?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  schoolYear: string;
  teacherName?: string;
  notes?: string;
  studentCount?: number;
  createdAt?: string;
}

