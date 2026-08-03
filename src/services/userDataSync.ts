import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { AppSettings, ExamPackage, QuestionBankItem } from '../types';
import { defaultSettings, sampleQuestionBank } from './storageEngine';

export interface UserDataPayload {
  settings: AppSettings;
  examHistory: ExamPackage[];
  questionBank: QuestionBankItem[];
  classes?: any[];
  students?: any[];
  updatedAt?: string;
}

const USER_DATA_COLLECTION = 'user_data';

export class UserDataSync {
  private static activeUserId: string | null = null;

  static setActiveUserId(userId: string | null) {
    this.activeUserId = userId;
  }

  static getActiveUserId(): string | null {
    return this.activeUserId;
  }

  /**
   * Keys for user-scoped LocalStorage
   */
  static getStorageKeys(userId: string) {
    const cleanId = userId ? userId.replace(/[^a-zA-Z0-9_]/g, '_') : 'guest';
    return {
      SETTINGS: `aitest_settings_${cleanId}`,
      EXAM_HISTORY: `aitest_exam_history_${cleanId}`,
      QUESTION_BANK: `aitest_question_bank_${cleanId}`,
    };
  }

  /**
   * Read user data from LocalStorage cache
   */
  static getLocalUserData(userId: string): UserDataPayload {
    const keys = this.getStorageKeys(userId);
    let settings = defaultSettings;
    let examHistory: ExamPackage[] = [];
    let questionBank: QuestionBankItem[] = [];

    try {
      const rawSettings = localStorage.getItem(keys.SETTINGS);
      if (rawSettings) settings = { ...defaultSettings, ...JSON.parse(rawSettings) };

      const rawHistory = localStorage.getItem(keys.EXAM_HISTORY);
      if (rawHistory) examHistory = JSON.parse(rawHistory);

      const rawBank = localStorage.getItem(keys.QUESTION_BANK);
      if (rawBank) questionBank = JSON.parse(rawBank);
    } catch (err) {
      console.warn(`Lỗi đọc LocalStorage cho user ${userId}:`, err);
    }

    return { settings, examHistory, questionBank };
  }

  /**
   * Save user data to LocalStorage cache
   */
  static saveLocalUserData(userId: string, data: Partial<UserDataPayload>): void {
    const keys = this.getStorageKeys(userId);
    try {
      if (data.settings) {
        localStorage.setItem(keys.SETTINGS, JSON.stringify(data.settings));
      }
      if (data.examHistory) {
        localStorage.setItem(keys.EXAM_HISTORY, JSON.stringify(data.examHistory));
      }
      if (data.questionBank) {
        localStorage.setItem(keys.QUESTION_BANK, JSON.stringify(data.questionBank));
      }
    } catch (err) {
      console.error(`Lỗi ghi LocalStorage cho user ${userId}:`, err);
    }
  }

  /**
   * Load user data from Firestore with LocalStorage cache fallback
   */
  static async loadUserData(userId: string): Promise<UserDataPayload> {
    if (!userId) {
      return { settings: defaultSettings, examHistory: [], questionBank: sampleQuestionBank };
    }

    const docRef = doc(db, USER_DATA_COLLECTION, userId);

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const remoteData = docSnap.data() as UserDataPayload;
        const settings = { ...defaultSettings, ...(remoteData.settings || {}) };
        const examHistory = Array.isArray(remoteData.examHistory) ? remoteData.examHistory : [];
        const questionBank = Array.isArray(remoteData.questionBank) ? remoteData.questionBank : sampleQuestionBank;

        const mergedPayload: UserDataPayload = {
          settings,
          examHistory,
          questionBank,
          classes: remoteData.classes || [],
          students: remoteData.students || [],
          updatedAt: remoteData.updatedAt,
        };

        // Cache locally for this user
        this.saveLocalUserData(userId, mergedPayload);

        return mergedPayload;
      }
    } catch (err) {
      console.warn(`Lỗi đọc Firestore user_data cho ${userId}:`, err);
    }

    // Fallback if doc does not exist yet or offline:
    // Check local storage for this user
    const local = this.getLocalUserData(userId);

    // Initial default payload for new user account
    const initialPayload: UserDataPayload = {
      settings: local.settings || defaultSettings,
      examHistory: local.examHistory || [],
      questionBank: local.questionBank && local.questionBank.length > 0 ? local.questionBank : sampleQuestionBank,
      updatedAt: new Date().toISOString(),
    };

    // Save initial document to Firestore
    try {
      await setDoc(docRef, initialPayload, { merge: true });
      this.saveLocalUserData(userId, initialPayload);
    } catch (err) {
      console.warn(`Lỗi khởi tạo document Firestore cho ${userId}:`, err);
    }

    return initialPayload;
  }

  /**
   * Save user data payload to Firestore and LocalStorage
   */
  static async saveUserData(userId: string, updates: Partial<UserDataPayload>): Promise<void> {
    if (!userId) return;

    // 1. Update Local Storage cache immediately
    this.saveLocalUserData(userId, updates);

    // 2. Sync to Firestore
    try {
      const docRef = doc(db, USER_DATA_COLLECTION, userId);
      await setDoc(
        docRef,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error(`Lỗi đồng bộ Firestore user_data cho ${userId}:`, err);
    }
  }

  /**
   * Realtime subscription for cross-device synchronization
   */
  static subscribeUserData(userId: string, onDataChanged: (data: UserDataPayload) => void) {
    if (!userId) return () => {};

    const docRef = doc(db, USER_DATA_COLLECTION, userId);

    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as UserDataPayload;
          const settings = { ...defaultSettings, ...(remoteData.settings || {}) };
          const examHistory = Array.isArray(remoteData.examHistory) ? remoteData.examHistory : [];
          const questionBank = Array.isArray(remoteData.questionBank) ? remoteData.questionBank : sampleQuestionBank;

          const payload: UserDataPayload = {
            settings,
            examHistory,
            questionBank,
            classes: remoteData.classes || [],
            students: remoteData.students || [],
            updatedAt: remoteData.updatedAt,
          };

          // Update local cache
          this.saveLocalUserData(userId, payload);
          onDataChanged(payload);
        }
      },
      (error) => {
        console.warn(`Lỗi lắng nghe dữ liệu Firestore cho ${userId}:`, error);
      }
    );
  }
}
