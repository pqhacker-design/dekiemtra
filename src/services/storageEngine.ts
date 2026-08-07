import { AppSettings, ExamPackage, QuestionBankItem } from '../types';
import { UserDataSync } from './userDataSync';
import { defaultSettings, sampleQuestionBank } from './defaults';

export { defaultSettings, sampleQuestionBank };

const STORAGE_KEYS = {
  SETTINGS: 'aitest_settings_v1',
  EXAM_HISTORY: 'aitest_exam_history_v1',
  QUESTION_BANK: 'aitest_question_bank_v1',
};

export class StorageEngine {
  private static currentUserId: string | null = null;

  static setCurrentUserId(userId: string | null) {
    this.currentUserId = userId;
    UserDataSync.setActiveUserId(userId);
  }

  static getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  private static getKey(baseKey: string): string {
    if (this.currentUserId) {
      const cleanId = this.currentUserId.replace(/[^a-zA-Z0-9_]/g, '_');
      return `${baseKey}_${cleanId}`;
    }
    return baseKey;
  }

  // Settings
  static getSettings(): AppSettings {
    try {
      const key = this.getKey(STORAGE_KEYS.SETTINGS);
      const data = localStorage.getItem(key);
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
      const key = this.getKey(STORAGE_KEYS.SETTINGS);
      localStorage.setItem(key, JSON.stringify(settings));

      if (this.currentUserId) {
        UserDataSync.saveUserData(this.currentUserId, { settings });
      }
    } catch (e) {
      console.error('Lỗi lưu settings:', e);
    }
  }

  // Exam History
  static getExamHistory(): ExamPackage[] {
    try {
      const key = this.getKey(STORAGE_KEYS.EXAM_HISTORY);
      const data = localStorage.getItem(key);
      let items: ExamPackage[] = data ? JSON.parse(data) : [];

      // Fallback check if user key returned empty but base key has items
      if (items.length === 0 && this.currentUserId) {
        const baseData = localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY);
        if (baseData) {
          try {
            const baseItems: ExamPackage[] = JSON.parse(baseData);
            if (baseItems.length > 0) items = baseItems;
          } catch {}
        }
      }

      // Also combine with UserDataSync local data if available
      if (this.currentUserId) {
        const localUserPayload = UserDataSync.getLocalUserData(this.currentUserId);
        if (localUserPayload.examHistory && localUserPayload.examHistory.length > 0) {
          const map = new Map<string, ExamPackage>();
          items.forEach((e) => e && e.id && map.set(e.id, e));
          localUserPayload.examHistory.forEach((e) => e && e.id && map.set(e.id, e));
          items = Array.from(map.values());
        }
      }

      return items;
    } catch (e) {
      console.error('Lỗi đọc lịch sử đề thi:', e);
      return [];
    }
  }

  static saveExamPackage(examPackage: ExamPackage): void {
    try {
      const history = this.getExamHistory();
      const updated = [examPackage, ...history.filter((e) => e.id !== examPackage.id)];
      const key = this.getKey(STORAGE_KEYS.EXAM_HISTORY);
      localStorage.setItem(key, JSON.stringify(updated));

      if (this.currentUserId) {
        UserDataSync.saveUserData(this.currentUserId, { examHistory: updated });
      }
    } catch (e) {
      console.error('Lỗi lưu gói đề thi:', e);
    }
  }

  static deleteExamPackage(id: string): void {
    try {
      const history = this.getExamHistory();
      const updated = history.filter((e) => e.id !== id);
      const key = this.getKey(STORAGE_KEYS.EXAM_HISTORY);
      localStorage.setItem(key, JSON.stringify(updated));

      if (this.currentUserId) {
        UserDataSync.saveUserData(this.currentUserId, { examHistory: updated });
      }
    } catch (e) {
      console.error('Lỗi xóa gói đề thi:', e);
    }
  }

  // Question Bank
  static getQuestionBank(): QuestionBankItem[] {
    try {
      const key = this.getKey(STORAGE_KEYS.QUESTION_BANK);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : sampleQuestionBank;
    } catch (e) {
      console.error('Lỗi đọc ngân hàng câu hỏi:', e);
      return sampleQuestionBank;
    }
  }

  static saveQuestionBank(questions: QuestionBankItem[]): void {
    try {
      const key = this.getKey(STORAGE_KEYS.QUESTION_BANK);
      localStorage.setItem(key, JSON.stringify(questions));

      if (this.currentUserId) {
        UserDataSync.saveUserData(this.currentUserId, { questionBank: questions });
      }
    } catch (e) {
      console.error('Lỗi lưu ngân hàng câu hỏi:', e);
    }
  }

  static saveToQuestionBank(questions: QuestionBankItem[]): void {
    try {
      const bank = this.getQuestionBank();
      const existingIds = new Set(bank.map((q) => q.id));
      const newItems = questions.filter((q) => !existingIds.has(q.id));
      const updated = [...newItems, ...bank];
      this.saveQuestionBank(updated);
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
      const keyHistory = this.getKey(STORAGE_KEYS.EXAM_HISTORY);
      const keyBank = this.getKey(STORAGE_KEYS.QUESTION_BANK);
      localStorage.removeItem(keyHistory);
      localStorage.removeItem(keyBank);

      if (this.currentUserId) {
        UserDataSync.saveUserData(this.currentUserId, {
          examHistory: [],
          questionBank: sampleQuestionBank,
        });
      }
    } catch (e) {
      console.error('Lỗi xóa dữ liệu storage:', e);
    }
  }
}
