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
  onlineExams?: any[];
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
      SETTINGS: `aitest_settings_v1_${cleanId}`,
      EXAM_HISTORY: `aitest_exam_history_v1_${cleanId}`,
      QUESTION_BANK: `aitest_question_bank_v1_${cleanId}`,
      CLASSES: `aitest_online_classes_store_${cleanId}`,
      STUDENTS: `aitest_online_students_store_${cleanId}`,
      ONLINE_EXAMS: `aitest_online_exams_store_${cleanId}`,
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
    let classes: any[] = [];
    let students: any[] = [];
    let onlineExams: any[] = [];

    try {
      const rawSettings = localStorage.getItem(keys.SETTINGS);
      if (rawSettings) settings = { ...defaultSettings, ...JSON.parse(rawSettings) };

      const rawHistory = localStorage.getItem(keys.EXAM_HISTORY);
      if (rawHistory) examHistory = JSON.parse(rawHistory);

      const rawBank = localStorage.getItem(keys.QUESTION_BANK);
      if (rawBank) questionBank = JSON.parse(rawBank);

      const rawClasses = localStorage.getItem(keys.CLASSES);
      if (rawClasses) classes = JSON.parse(rawClasses);

      const rawStudents = localStorage.getItem(keys.STUDENTS);
      if (rawStudents) students = JSON.parse(rawStudents);

      const rawOnlineExams = localStorage.getItem(keys.ONLINE_EXAMS);
      if (rawOnlineExams) onlineExams = JSON.parse(rawOnlineExams);
    } catch (err) {
      console.warn(`Lỗi đọc LocalStorage cho user ${userId}:`, err);
    }

    return { settings, examHistory, questionBank, classes, students, onlineExams };
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
      if (data.classes) {
        localStorage.setItem(keys.CLASSES, JSON.stringify(data.classes));
      }
      if (data.students) {
        localStorage.setItem(keys.STUDENTS, JSON.stringify(data.students));
      }
      if (data.onlineExams) {
        localStorage.setItem(keys.ONLINE_EXAMS, JSON.stringify(data.onlineExams));
      }
    } catch (err) {
      console.error(`Lỗi ghi LocalStorage cho user ${userId}:`, err);
    }
  }

  /**
   * Helper to merge remote array with local array by unique ID
   */
  private static mergeArrays<T>(remote: T[] | undefined, localItems: T[] | undefined, getId: (item: T) => string): T[] {
    const map = new Map<string, T>();
    (remote || []).forEach((item) => {
      if (!item) return;
      const id = getId(item);
      if (id) map.set(id, item);
    });
    (localItems || []).forEach((item) => {
      if (!item) return;
      const id = getId(item);
      if (id) {
        if (!map.has(id)) {
          map.set(id, item);
        } else {
          map.set(id, { ...map.get(id)!, ...item });
        }
      }
    });
    return Array.from(map.values());
  }

  /**
   * Load user data from Firestore with LocalStorage cache fallback and array merging
   */
  static async loadUserData(userId: string): Promise<UserDataPayload> {
    const local = userId ? this.getLocalUserData(userId) : { settings: defaultSettings, examHistory: [], questionBank: sampleQuestionBank, classes: [], students: [], onlineExams: [] };

    if (!userId) {
      return { settings: defaultSettings, examHistory: local.examHistory || [], questionBank: local.questionBank || sampleQuestionBank, classes: [], students: [], onlineExams: [] };
    }

    const docRef = doc(db, USER_DATA_COLLECTION, userId);

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const remoteData = docSnap.data() as UserDataPayload;
        const settings = { ...defaultSettings, ...(remoteData.settings || {}), ...(local.settings || {}) };
        
        // Combine remote with local arrays to ensure no newly generated local data is lost
        const examHistory = this.mergeArrays(remoteData.examHistory, local.examHistory, (e) => e.id);
        const questionBank = this.mergeArrays(remoteData.questionBank, local.questionBank, (q) => q.id);
        const classes = this.mergeArrays(remoteData.classes, local.classes, (c) => c.id);
        const students = this.mergeArrays(remoteData.students, local.students, (s) => s.sbd || s.id);
        const onlineExams = this.mergeArrays(remoteData.onlineExams, local.onlineExams, (e) => e.code || e.id);

        const mergedPayload: UserDataPayload = {
          settings,
          examHistory,
          questionBank,
          classes,
          students,
          onlineExams,
          updatedAt: remoteData.updatedAt || new Date().toISOString(),
        };

        // Cache merged payload locally
        this.saveLocalUserData(userId, mergedPayload);

        return mergedPayload;
      }
    } catch (err) {
      console.warn(`Lỗi đọc Firestore user_data cho ${userId}:`, err);
    }

    // Initial default payload for user account
    const initialPayload: UserDataPayload = {
      settings: local.settings || defaultSettings,
      examHistory: local.examHistory || [],
      questionBank: local.questionBank && local.questionBank.length > 0 ? local.questionBank : sampleQuestionBank,
      classes: local.classes || [],
      students: local.students || [],
      onlineExams: local.onlineExams || [],
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

    // 1. Update Local Storage cache immediately with merged items
    const local = this.getLocalUserData(userId);
    const updatedPayload: UserDataPayload = {
      settings: updates.settings ? { ...local.settings, ...updates.settings } : local.settings,
      examHistory: updates.examHistory ? this.mergeArrays(updates.examHistory, local.examHistory, (e) => e.id) : local.examHistory,
      questionBank: updates.questionBank ? this.mergeArrays(updates.questionBank, local.questionBank, (q) => q.id) : local.questionBank,
      classes: updates.classes ? this.mergeArrays(updates.classes, local.classes, (c) => c.id) : local.classes,
      students: updates.students ? this.mergeArrays(updates.students, local.students, (s) => s.sbd || s.id) : local.students,
      onlineExams: updates.onlineExams ? this.mergeArrays(updates.onlineExams, local.onlineExams, (e) => e.code || e.id) : local.onlineExams,
    };

    this.saveLocalUserData(userId, updatedPayload);

    // 2. Sync to Firestore (pruning examHistory array to top 15 most recent to fit in 1MB Firestore doc limit)
    try {
      const docRef = doc(db, USER_DATA_COLLECTION, userId);
      const firestorePayload = { ...updatedPayload };
      if (firestorePayload.examHistory && firestorePayload.examHistory.length > 15) {
        firestorePayload.examHistory = firestorePayload.examHistory.slice(0, 15);
      }

      await setDoc(
        docRef,
        {
          ...firestorePayload,
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
          const local = this.getLocalUserData(userId);

          const settings = { ...defaultSettings, ...(remoteData.settings || {}), ...(local.settings || {}) };
          const examHistory = this.mergeArrays(remoteData.examHistory, local.examHistory, (e) => e.id);
          const questionBank = this.mergeArrays(remoteData.questionBank, local.questionBank, (q) => q.id);
          const classes = this.mergeArrays(remoteData.classes, local.classes, (c) => c.id);
          const students = this.mergeArrays(remoteData.students, local.students, (s) => s.sbd || s.id);
          const onlineExams = this.mergeArrays(remoteData.onlineExams, local.onlineExams, (e) => e.code || e.id);

          const payload: UserDataPayload = {
            settings,
            examHistory,
            questionBank,
            classes,
            students,
            onlineExams,
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
