import { AppSettings, ExamPackage, QuestionBankItem } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'aitest_settings_v1',
  EXAM_HISTORY: 'aitest_exam_history_v1',
  QUESTION_BANK: 'aitest_question_bank_v1',
};

export const defaultSettings: AppSettings = {
  defaultSchoolName: 'Trường THCS Bình San',
  defaultDepartmentName: 'Sở Giáo dục và Đào tạo',
  defaultTeacherName: 'Giáo viên',
  selectedModel: 'gemini-3.6-flash',
  theme: 'light',
  saveExamHistory: true,
  autoSaveToBank: true,
};

export class StorageEngine {
  // Settings
  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return defaultSettings;
      const parsed = JSON.parse(data);
      if (parsed.defaultSchoolName === 'Trường THPT Nguyễn Trãi' || parsed.defaultSchoolName === 'THPT Nguyễn Trãi') {
        parsed.defaultSchoolName = 'Trường THCS Bình San';
      }
      return { ...defaultSettings, ...parsed };
    } catch (e) {
      console.error('Lỗi đọc settings:', e);
      return defaultSettings;
    }
  }

  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Lỗi lưu settings:', e);
    }
  }

  // Exam History
  static getExamHistory(): ExamPackage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Lỗi đọc lịch sử đề thi:', e);
      return [];
    }
  }

  static saveExamPackage(examPackage: ExamPackage): void {
    try {
      const history = this.getExamHistory();
      const updated = [examPackage, ...history.filter((e) => e.id !== examPackage.id)];
      localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Lỗi lưu gói đề thi:', e);
    }
  }

  static deleteExamPackage(id: string): void {
    try {
      const history = this.getExamHistory();
      const updated = history.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Lỗi xóa gói đề thi:', e);
    }
  }

  // Question Bank
  static getQuestionBank(): QuestionBankItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUESTION_BANK);
      return data ? JSON.parse(data) : sampleQuestionBank;
    } catch (e) {
      console.error('Lỗi đọc ngân hàng câu hỏi:', e);
      return sampleQuestionBank;
    }
  }

  static saveQuestionBank(questions: QuestionBankItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTION_BANK, JSON.stringify(questions));
    } catch (e) {
      console.error('Lỗi lưu ngân hàng câu hỏi:', e);
    }
  }

  static saveToQuestionBank(questions: QuestionBankItem[]): void {
    try {
      const bank = this.getQuestionBank();
      const existingIds = new Set(bank.map((q) => q.id));
      const newItems = questions.filter((q) => !existingIds.has(q.id));
      this.saveQuestionBank([...newItems, ...bank]);
    } catch (e) {
      console.error('Lỗi lưu câu hỏi vào ngân hàng:', e);
    }
  }

  static deleteFromQuestionBank(id: string): void {
    try {
      const bank = this.getQuestionBank();
      const updated = bank.filter((q) => q.id !== id);
      this.saveQuestionBank(updated);
    } catch (e) {
      console.error('Lỗi xóa câu hỏi:', e);
    }
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.EXAM_HISTORY);
      localStorage.removeItem(STORAGE_KEYS.QUESTION_BANK);
    } catch (e) {
      console.error('Lỗi xóa dữ liệu storage:', e);
    }
  }
}

export const sampleQuestionBank: QuestionBankItem[] = [
  {
    id: 'qb-sample-1',
    subject: 'Toán',
    grade: 'Khối 10',
    chapter: 'Hàm số bậc hai và đồ thị',
    curriculum: 'Kết nối tri thức với cuộc sống',
    partType: 'PART1',
    partTitle: 'PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn',
    number: 1,
    content: 'Tập xác định của hàm số $y = \\sqrt{x - 2}$ là:',
    cognitiveLevel: 'REMEMBER',
    points: 0.25,
    topic: 'Hàm số bậc hai',
    options: [
      { key: 'A', content: '$D = [2; +\\infty)$' },
      { key: 'B', content: '$D = (2; +\\infty)$' },
      { key: 'C', content: '$D = (-\\infty; 2]$' },
      { key: 'D', content: '$D = \\mathbb{R} \\setminus \\{2\\}$' },
    ],
    correctOption: 'A',
    explanation: 'Biểu thức dưới dấu căn không âm: $x - 2 \\ge 0 \\Leftrightarrow x \\ge 2$. Vậy tập xác định là $D = [2; +\\infty)$.',
    createdDate: new Date().toISOString(),
  },
  {
    id: 'qb-sample-2',
    subject: 'Toán',
    grade: 'Khối 10',
    chapter: 'Vectơ trong mặt phẳng tọa độ',
    curriculum: 'Kết nối tri thức với cuộc sống',
    partType: 'PART2',
    partTitle: 'PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai',
    number: 1,
    content: 'Trong mặt phẳng $Oxy$, cho các điểm $A(1; 2)$, $B(3; -2)$, $C(-1; 4)$.',
    cognitiveLevel: 'UNDERSTAND',
    points: 1.0,
    topic: 'Vectơ',
    trueFalseStatements: [
      { key: 'a', content: 'Tọa độ vectơ $\\vec{AB} = (2; -4)$.', isCorrect: true },
      { key: 'b', content: 'Trung điểm $M$ của đoạn thẳng $AB$ có tọa độ $M(2; 0)$.', isCorrect: true },
      { key: 'c', content: 'Độ dài đoạn thẳng $AB$ bằng $2\\sqrt{5}$.', isCorrect: true },
      { key: 'd', content: 'Ba điểm $A, B, C$ thẳng hàng.', isCorrect: false },
    ],
    explanation: '$\\vec{AB} = (3-1; -2-2) = (2; -4)$. $M((1+3)/2; (2-2)/2) = (2; 0)$. $AB = \\sqrt{2^2 + (-4)^2} = \\sqrt{20} = 2\\sqrt{5}$. $\\vec{AC} = (-2; 2)$ không cùng phương với $\\vec{AB}$.',
    createdDate: new Date().toISOString(),
  },
  {
    id: 'qb-sample-3',
    subject: 'KHTN',
    grade: 'Khối 8',
    chapter: 'Biến đổi hóa học và năng lượng',
    curriculum: 'Cánh Diều',
    partType: 'PART3',
    partTitle: 'PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn',
    number: 1,
    content: 'Tính khối lượng mol (g/mol) của phân tử đường sucrose có công thức hóa học $C_{12}H_{22}O_{11}$. (Cho $C=12, H=1, O=16$).',
    cognitiveLevel: 'APPLY',
    points: 0.25,
    topic: 'Khối lượng mol',
    shortAnswer: '342',
    explanation: '$M = 12 \\times 12 + 22 \\times 1 + 11 \\times 16 = 144 + 22 + 176 = 342$ g/mol.',
    createdDate: new Date().toISOString(),
  },
  {
    id: 'qb-sample-4',
    subject: 'Ngữ văn',
    grade: 'Khối 10',
    chapter: 'Thơ ca dân gian và truyền thống',
    curriculum: 'Chân trời sáng tạo',
    partType: 'PART4',
    partTitle: 'PHẦN IV. Viết (Tự luận)',
    number: 1,
    content: 'Viết bài văn nghị luận (khoảng 500 chữ) phân tích nét đặc sắc nghệ thuật và thông điệp nhân văn trong một tác phẩm văn học dân gian mà em yêu thích.',
    cognitiveLevel: 'ADVANCED',
    points: 3.0,
    topic: 'Nghị luận văn học',
    essayAnswerGuide: '1. Mở bài: Giới thiệu tác phẩm dân gian và thông điệp chính.\n2. Thân bài: Phân tích nét đặc sắc nghệ thuật (hình ảnh, ngôn từ, thể loại, biện pháp tu từ) và nêu rõ ý nghĩa thông điệp nhân văn.\n3. Kết bài: Khái quát lại giá trị tác phẩm và bài học cá nhân.',
    rubric: [
      { criteria: 'Mở bài & Kết bài', points: 0.5, description: 'Giới thiệu trúng vấn đề, kết bài có ấn tượng.' },
      { criteria: 'Phân tích nghệ thuật', points: 1.0, description: 'Chỉ ra đầy đủ và sâu sắc các yếu tố nghệ thuật đặc trưng.' },
      { criteria: 'Nêu thông điệp nhân văn', points: 1.0, description: 'Lập luận chặt chẽ, tư tưởng tiến bộ và có tính sức thuyết phục.' },
      { criteria: 'Sáng tạo & Chính tả', points: 0.5, description: 'Diễn đạt lưu khoát, văn phong truyền cảm, không mắc lỗi chính tả.' },
    ],
    createdDate: new Date().toISOString(),
  },
];
