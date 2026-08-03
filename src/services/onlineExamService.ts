// Frontend API Client Service for Online Exam System (Hybrid Backend + LocalStorage Fallback)

import { UserDataSync } from './userDataSync';
import { StorageEngine } from './storageEngine';
import { doc, getDoc, setDoc, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export interface OnlineExamItem {
  id: string;
  code: string;
  title: string;
  subject: string;
  grade: string;
  duration: number;
  totalPoints: number;
  createdDate: string;
  status: 'active' | 'locked';
  allowedClasses?: string[];
  questionCount: number;
  submissionCount: number;
  activeSessionCount: number;
  antiCheat: {
    disallowPrevious: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    autoSubmitOnTimeout: boolean;
    warnTabSwitch: boolean;
    tabSwitchLimit: number;
  };
}

export interface StudentResultItem {
  id: string;
  examCode: string;
  studentName: string;
  studentClass: string;
  studentSbd?: string;
  studentId?: string;
  studentSchool?: string;
  startTime: string;
  submitTime?: string;
  durationMinutes: number;
  score: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  tabSwitches: number;
  activityLogs: { timestamp: string; event: string; details?: string }[];
}

export class OnlineExamService {
  private static getActiveUserId(): string {
    return UserDataSync.getActiveUserId() || StorageEngine.getCurrentUserId() || 'guest';
  }

  private static getStorageKeys() {
    const userId = this.getActiveUserId();
    const cleanId = userId ? userId.replace(/[^a-zA-Z0-9_]/g, '_') : 'guest';
    return {
      EXAMS: `aitest_online_exams_store_${cleanId}`,
      SESSIONS: `aitest_online_sessions_store_${cleanId}`,
      CLASSES: `aitest_online_classes_store_${cleanId}`,
      STUDENTS: `aitest_online_students_store_${cleanId}`,
    };
  }

  private static syncToFirestore(): void {
    const userId = this.getActiveUserId();
    if (userId && userId !== 'guest') {
      UserDataSync.saveUserData(userId, {
        classes: this.getLocalClasses(),
        students: this.getLocalStudents(),
        onlineExams: this.getLocalExams(),
      });
    }
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const userId = this.getActiveUserId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as any) || {}),
    };
    if (userId && userId !== 'guest') {
      headers['x-user-id'] = userId;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // Non-JSON response (e.g. 404 HTML page on Vercel static deployment)
    }

    if (res.ok && data && data.error === undefined) {
      return data as T;
    }

    if (data && data.error) {
      throw new Error(data.error);
    }

    throw new Error('SERVER_OFFLINE_OR_NON_JSON');
  }

  // --- LocalStorage Helpers ---
  private static generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static getLocalExams(): any[] {
    try {
      const keys = this.getStorageKeys();
      const data = localStorage.getItem(keys.EXAMS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private static saveLocalExams(exams: any[]): void {
    try {
      const keys = this.getStorageKeys();
      localStorage.setItem(keys.EXAMS, JSON.stringify(exams));
      this.syncToFirestore();
    } catch (e) {
      console.error('Lỗi lưu exams local:', e);
    }
  }

  private static getLocalSessions(): any[] {
    try {
      const keys = this.getStorageKeys();
      const data = localStorage.getItem(keys.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalSessions(sessions: any[]): void {
    try {
      const keys = this.getStorageKeys();
      localStorage.setItem(keys.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Lỗi lưu sessions local:', e);
    }
  }

  private static getLocalClasses(): any[] {
    try {
      const keys = this.getStorageKeys();
      const data = localStorage.getItem(keys.CLASSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalClasses(classes: any[]): void {
    try {
      const keys = this.getStorageKeys();
      localStorage.setItem(keys.CLASSES, JSON.stringify(classes));
      this.syncToFirestore();
    } catch (e) {
      console.error('Lỗi lưu classes local:', e);
    }
  }

  private static getLocalStudents(): any[] {
    try {
      const keys = this.getStorageKeys();
      const data = localStorage.getItem(keys.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalStudents(students: any[]): void {
    try {
      const keys = this.getStorageKeys();
      localStorage.setItem(keys.STUDENTS, JSON.stringify(students));
      this.syncToFirestore();
    } catch (e) {
      console.error('Lỗi lưu students local:', e);
    }
  }

  private static async syncPublishedExamToFirestore(exam: any): Promise<void> {
    if (!exam || !exam.code) return;
    try {
      const codeUpper = exam.code.trim().toUpperCase();
      const docRef = doc(db, 'published_exams', codeUpper);
      const userId = this.getActiveUserId();
      await setDoc(
        docRef,
        {
          ...exam,
          code: codeUpper,
          createdBy: userId || exam.createdBy || 'anonymous',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Lỗi đồng bộ published_exams tới Firestore:', e);
    }
  }

  private static async getPublishedExamFromFirestore(code: string): Promise<any | null> {
    if (!code) return null;
    try {
      const codeUpper = code.trim().toUpperCase();
      const docRef = doc(db, 'published_exams', codeUpper);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.warn('Lỗi đọc published_exams từ Firestore:', e);
    }
    return null;
  }

  private static async syncStudentResultToFirestore(resultItem: StudentResultItem): Promise<void> {
    if (!resultItem || !resultItem.id) return;
    try {
      const docRef = doc(db, 'student_results', resultItem.id);
      await setDoc(
        docRef,
        {
          ...resultItem,
          examCode: resultItem.examCode ? resultItem.examCode.trim().toUpperCase() : '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Lỗi lưu student_results tới Firestore:', e);
    }
  }

  private static async getStudentResultsFromFirestore(examCode: string = 'ALL'): Promise<StudentResultItem[]> {
    try {
      const colRef = collection(db, 'student_results');
      let q = colRef as any;
      if (examCode && examCode !== 'ALL') {
        const codeUpper = examCode.trim().toUpperCase();
        q = query(colRef, where('examCode', '==', codeUpper));
      }
      const snap = await getDocs(q);
      const items: StudentResultItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as StudentResultItem;
        if (data && data.id) {
          items.push(data);
        }
      });
      return items;
    } catch (e) {
      console.warn('Lỗi đọc student_results từ Firestore:', e);
      return [];
    }
  }

  // 1. Save or Publish Exam
  static async saveExam(data: {
    code?: string;
    title?: string;
    subject?: string;
    grade?: string;
    duration?: number;
    totalPoints?: number;
    topic?: string;
    allowExplanations?: boolean;
    allowedClasses?: string[];
    antiCheat?: {
      disallowPrevious?: boolean;
      shuffleQuestions?: boolean;
      shuffleOptions?: boolean;
      autoSubmitOnTimeout?: boolean;
      warnTabSwitch?: boolean;
      tabSwitchLimit?: number;
    };
    examPackage: any;
  }) {
    let savedResult: { success: boolean; code: string; exam: any } | null = null;
    try {
      savedResult = await this.request<{ success: boolean; code: string; exam: any }>('/api/exam/save', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (
        err.message &&
        err.message !== 'SERVER_OFFLINE_OR_NON_JSON' &&
        !err.message.includes('Unexpected') &&
        !err.message.includes('JSON') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }

      // LocalStorage Fallback
      const code = (data.code || this.generateRandomCode()).trim().toUpperCase();
      const newExam: any = {
        id: 'exam_local_' + Date.now(),
        code,
        title: data.title || 'Đề kiểm tra trực tuyến',
        subject: data.subject || 'Toán',
        grade: data.grade || 'Khối 10',
        duration: data.duration || 45,
        totalPoints: data.totalPoints || 10.0,
        topic: data.topic || '',
        createdDate: new Date().toISOString(),
        status: 'active',
        allowExplanations: data.allowExplanations !== false,
        allowedClasses: data.allowedClasses || [],
        antiCheat: data.antiCheat || {
          disallowPrevious: false,
          shuffleQuestions: true,
          shuffleOptions: true,
          autoSubmitOnTimeout: true,
          warnTabSwitch: true,
          tabSwitchLimit: 3,
        },
        examPackage: data.examPackage,
      };

      const localExams = this.getLocalExams();
      const updated = [newExam, ...localExams.filter((e) => e.code.toUpperCase() !== code)];
      this.saveLocalExams(updated);

      savedResult = { success: true, code, exam: newExam };
    }

    if (savedResult && savedResult.exam) {
      await this.syncPublishedExamToFirestore(savedResult.exam);
      const localExams = this.getLocalExams();
      const updated = [
        savedResult.exam,
        ...localExams.filter((e) => e.code.toUpperCase() !== savedResult!.code.toUpperCase()),
      ];
      this.saveLocalExams(updated);
    }

    return savedResult;
  }

  // 2. List all exams for Teacher
  static async listExams() {
    let apiExams: OnlineExamItem[] = [];
    try {
      const res = await this.request<{ success: boolean; exams: OnlineExamItem[] }>('/api/exam/list');
      if (res.success && Array.isArray(res.exams)) {
        apiExams = res.exams;
      }
    } catch {
      // ignore API failure
    }

    const localExams = this.getLocalExams();
    const localItems: OnlineExamItem[] = localExams.map((e) => {
      const pkg = e.examPackage || {};
      const qCount = pkg.exams?.[0]?.questions?.length || 10;
      const sessions = this.getLocalSessions().filter((s) => s.examCode.toUpperCase() === e.code.toUpperCase());
      const activeSessions = sessions.filter((s) => s.status === 'in_progress');
      const submitted = sessions.filter((s) => s.status === 'submitted');

      return {
        id: e.id || 'exam_' + e.code,
        code: e.code,
        title: e.title,
        subject: e.subject,
        grade: e.grade,
        duration: e.duration,
        totalPoints: e.totalPoints,
        createdDate: e.createdDate,
        status: e.status || 'active',
        allowedClasses: e.allowedClasses || [],
        questionCount: qCount,
        submissionCount: submitted.length,
        activeSessionCount: activeSessions.length,
        antiCheat: e.antiCheat || {
          disallowPrevious: false,
          shuffleQuestions: true,
          shuffleOptions: true,
          autoSubmitOnTimeout: true,
          warnTabSwitch: true,
          tabSwitchLimit: 3,
        },
      };
    });

    let firestoreExams: OnlineExamItem[] = [];
    try {
      const colRef = collection(db, 'published_exams');
      const snap = await getDocs(colRef);
      snap.forEach((d) => {
        const e = d.data() as any;
        if (e && e.code) {
          const pkg = e.examPackage || {};
          const qCount = pkg.exams?.[0]?.questions?.length || 10;
          firestoreExams.push({
            id: e.id || 'exam_fs_' + e.code,
            code: e.code,
            title: e.title || 'Đề kiểm tra',
            subject: e.subject || 'Môn học',
            grade: e.grade || 'Khối 10',
            duration: e.duration || 45,
            totalPoints: e.totalPoints || 10.0,
            createdDate: e.createdDate || new Date().toISOString(),
            status: e.status || 'active',
            allowedClasses: e.allowedClasses || [],
            questionCount: qCount,
            submissionCount: 0,
            activeSessionCount: 0,
            antiCheat: e.antiCheat || {
              disallowPrevious: false,
              shuffleQuestions: true,
              shuffleOptions: true,
              autoSubmitOnTimeout: true,
              warnTabSwitch: true,
              tabSwitchLimit: 3,
            },
          });
        }
      });
    } catch (e) {
      console.warn('Lỗi đọc published_exams từ Firestore:', e);
    }

    const map = new Map<string, OnlineExamItem>();
    [...apiExams, ...firestoreExams, ...localItems].forEach((item) => {
      if (item && item.code) {
        const key = item.code.trim().toUpperCase();
        if (!map.has(key)) {
          map.set(key, item);
        }
      }
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
    );

    return { success: true, exams: merged };
  }

  // 3. Get Exam Detail
  static async getExamDetail(code: string) {
    const cleanCode = (code || '').trim().toUpperCase();
    try {
      return await this.request<{ success: boolean; exam: any }>(`/api/exam/detail/${encodeURIComponent(cleanCode)}`);
    } catch {
      const firestoreExam = await this.getPublishedExamFromFirestore(cleanCode);
      if (firestoreExam) {
        return { success: true, exam: firestoreExam };
      }

      const exams = this.getLocalExams();
      const exam = exams.find((e) => e.code.toUpperCase() === cleanCode);
      if (!exam) {
        throw new Error(`Không tìm thấy đề thi với mã '${cleanCode}'. Vui lòng kiểm tra lại mã đề từ giáo viên.`);
      }
      return { success: true, exam };
    }
  }

  // 4. Update Exam Status / Settings / Questions & Points
  static async updateExam(
    code: string,
    data: {
      status?: 'active' | 'locked';
      allowExplanations?: boolean;
      duration?: number;
      antiCheat?: any;
      examPackage?: any;
      totalPoints?: number;
      title?: string;
    }
  ) {
    const cleanCode = (code || '').trim().toUpperCase();
    let updatedExam: any = null;
    try {
      const res = await this.request<{ success: boolean; exam: any }>(`/api/exam/update/${encodeURIComponent(cleanCode)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (res.success && res.exam) {
        updatedExam = res.exam;
      }
    } catch {
      const exams = this.getLocalExams();
      const index = exams.findIndex((e) => e.code.toUpperCase() === cleanCode);
      if (index !== -1) {
        const existing = exams[index];
        updatedExam = {
          ...existing,
          ...data,
          antiCheat: data.antiCheat ? { ...existing.antiCheat, ...data.antiCheat } : existing.antiCheat,
        };
        exams[index] = updatedExam;
        this.saveLocalExams(exams);
      }
    }

    if (!updatedExam) {
      const firestoreExam = await this.getPublishedExamFromFirestore(cleanCode);
      if (firestoreExam) {
        updatedExam = {
          ...firestoreExam,
          ...data,
          antiCheat: data.antiCheat ? { ...firestoreExam.antiCheat, ...data.antiCheat } : firestoreExam.antiCheat,
        };
      }
    }

    if (updatedExam) {
      await this.syncPublishedExamToFirestore(updatedExam);
      return { success: true, exam: updatedExam };
    }

    throw new Error('Không tìm thấy đề thi để cập nhật.');
  }

  // 5. Delete Exam
  static async deleteExam(code: string) {
    const cleanCode = (code || '').trim().toUpperCase();
    try {
      await this.request<{ success: boolean; message: string }>(
        `/api/exam/delete/${encodeURIComponent(cleanCode)}`,
        {
          method: 'DELETE',
        }
      );
    } catch {
      // ignore
    }

    const exams = this.getLocalExams().filter((e) => e.code.toUpperCase() !== cleanCode);
    this.saveLocalExams(exams);

    try {
      const docRef = doc(db, 'published_exams', cleanCode);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Lỗi xóa published_exams từ Firestore:', e);
    }

    return { success: true, message: 'Đã xóa đề thi thành công.' };
  }

  // 6. Get Student Exam Public Info
  static async getStudentExamInfo(code: string) {
    const cleanCode = (code || '').trim().toUpperCase();
    try {
      const res = await this.request<{
        success: boolean;
        info: {
          code: string;
          title: string;
          subject: string;
          grade: string;
          duration: number;
          totalPoints: number;
          antiCheat: any;
          questionCount: number;
          allowedClasses?: string[];
        };
      }>(`/api/exam/student-info/${encodeURIComponent(cleanCode)}`);
      return res;
    } catch {
      const firestoreExam = await this.getPublishedExamFromFirestore(cleanCode);
      if (firestoreExam) {
        if (firestoreExam.status === 'locked') {
          throw new Error('Đề thi này hiện đang bị khóa bởi giáo viên.');
        }
        const questions = firestoreExam.examPackage?.exams?.[0]?.questions || [];
        return {
          success: true,
          info: {
            code: firestoreExam.code,
            title: firestoreExam.title,
            subject: firestoreExam.subject,
            grade: firestoreExam.grade,
            duration: firestoreExam.duration,
            totalPoints: firestoreExam.totalPoints,
            antiCheat: firestoreExam.antiCheat,
            questionCount: questions.length,
            allowedClasses: firestoreExam.allowedClasses,
          },
        };
      }

      const examRes = await this.getExamDetail(cleanCode);
      const exam = examRes.exam;
      if (exam.status === 'locked') {
        throw new Error('Đề thi này hiện đang bị khóa bởi giáo viên.');
      }
      const questions = exam.examPackage?.exams?.[0]?.questions || [];
      return {
        success: true,
        info: {
          code: exam.code,
          title: exam.title,
          subject: exam.subject,
          grade: exam.grade,
          duration: exam.duration,
          totalPoints: exam.totalPoints,
          antiCheat: exam.antiCheat,
          questionCount: questions.length,
          allowedClasses: exam.allowedClasses,
        },
      };
    }
  }

  // 7. Start Student Exam Session
  static async startStudentExam(data: {
    code: string;
    studentName: string;
    studentClass: string;
    studentId?: string;
    studentSchool?: string;
  }) {
    try {
      return await this.request<any>('/api/exam/start', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (
        err.message &&
        err.message !== 'SERVER_OFFLINE_OR_NON_JSON' &&
        !err.message.includes('Unexpected') &&
        !err.message.includes('JSON')
      ) {
        throw err;
      }

      const examRes = await this.getExamDetail(data.code);
      const exam = examRes.exam;

      if (exam.status === 'locked') {
        throw new Error('Đề thi này hiện đang bị khóa.');
      }

      const normalizeClassStr = (str: string) =>
        str ? str.trim().toLowerCase().replace(/^(lớp|lop|class)\s*/gi, '').replace(/[^a-z0-9]/gi, '') : '';

      const normalizeNameStr = (str: string) =>
        str ? str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ') : '';

      if (exam.allowedClasses && Array.isArray(exam.allowedClasses) && exam.allowedClasses.length > 0) {
        const studentNormClass = normalizeClassStr(data.studentClass);
        const isAllowed = exam.allowedClasses.some(
          (c) => normalizeClassStr(c) === studentNormClass
        );
        if (!isAllowed) {
          throw new Error(
            `Cảnh báo: Tên lớp "${data.studentClass}" không thuộc danh sách các lớp được phép làm bài thi này (${exam.allowedClasses.join(', ')}). Vui lòng kiểm tra lại thông tin tên và lớp!`
          );
        }
      }

      // Database validation against classes & students (Firestore, API, Local)
      const classesRes = await this.getClasses();
      const studentsRes = await this.getStudents();
      const localClasses = classesRes.classes || [];
      const localStudents = studentsRes.students || [];

      const normClass = normalizeClassStr(data.studentClass);
      const normName = normalizeNameStr(data.studentName);

      if (localClasses.length > 0 || localStudents.length > 0) {
        const isClassValid =
          localClasses.some((c) => normalizeClassStr(c.name) === normClass || c.id === data.studentClass) ||
          localStudents.some((s) => normalizeClassStr(s.className) === normClass) ||
          (exam.allowedClasses && exam.allowedClasses.some((c) => normalizeClassStr(c) === normClass));

        if (!isClassValid) {
          throw new Error(
            `Cảnh báo: Lớp "${data.studentClass}" không tồn tại trên hệ thống. Vui lòng kiểm tra lại thông tin tên và lớp!`
          );
        }
      }

      if (localStudents.length > 0) {
        const matchingNameStudents = localStudents.filter(
          (s) =>
            normalizeNameStr(s.name) === normName ||
            s.name.trim().toLowerCase() === data.studentName.trim().toLowerCase()
        );

        if (matchingNameStudents.length > 0) {
          const exactMatch = matchingNameStudents.find(
            (s) => normalizeClassStr(s.className) === normClass || s.classId === data.studentClass
          );
          if (!exactMatch) {
            const actualClass = matchingNameStudents[0].className;
            throw new Error(
              `Cảnh báo: Học sinh "${data.studentName}" trên hệ thống thuộc Lớp "${actualClass}", không phải Lớp "${data.studentClass}". Vui lòng kiểm tra lại thông tin lớp!`
            );
          }
        } else {
          const studentsInClass = localStudents.filter(
            (s) => normalizeClassStr(s.className) === normClass || s.classId === data.studentClass
          );
          if (studentsInClass.length > 0) {
            throw new Error(
              `Cảnh báo: Không tìm thấy học sinh "${data.studentName}" trong danh sách Lớp "${data.studentClass}" trên hệ thống. Vui lòng kiểm tra lại chính xác Họ và Tên!`
            );
          } else {
            throw new Error(
              `Cảnh báo: Học sinh "${data.studentName}" (Lớp ${data.studentClass}) không có trong danh sách học sinh của hệ thống. Vui lòng kiểm tra lại thông tin tên và lớp!`
            );
          }
        }
      }

      const sessions = this.getLocalSessions();
      const session = sessions.find(
        (s) =>
          s.examCode.toUpperCase() === data.code.toUpperCase() &&
          s.studentName.toLowerCase().trim() === data.studentName.toLowerCase().trim() &&
          s.studentClass.toLowerCase().trim() === data.studentClass.toLowerCase().trim()
      );

      if (session) {
        if (session.status === 'submitted') {
          return {
            success: true,
            isAlreadySubmitted: true,
            result: {
              score: session.score || 0,
              correctCount: session.correctCount || 0,
              incorrectCount: session.incorrectCount || 0,
              totalQuestions: session.totalQuestions || 0,
              startTime: session.startTime,
              submitTime: session.submitTime,
              allowExplanations: exam.allowExplanations,
            },
          };
        }
        return {
          success: true,
          isResume: true,
          session,
          questions: session.shuffledQuestions,
          examInfo: {
            title: exam.title,
            subject: exam.subject,
            grade: exam.grade,
            duration: exam.duration,
            totalPoints: exam.totalPoints,
            antiCheat: exam.antiCheat,
          },
        };
      }

      const questions = exam.examPackage?.exams?.[0]?.questions || [];
      const sanitizedQuestions = questions.map((q: any) => {
        const clean = { ...q };
        delete clean.correctOption;
        delete clean.correctAnswer;
        delete clean.shortAnswer;
        delete clean.essayAnswerGuide;
        if (!exam.allowExplanations) delete clean.explanation;
        return clean;
      });

      const newSession: any = {
        id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        examCode: exam.code,
        studentName: data.studentName,
        studentClass: data.studentClass,
        studentId: data.studentId || '',
        studentSchool: data.studentSchool || '',
        seed: String(Date.now()),
        startTime: new Date().toISOString(),
        remainingSeconds: exam.duration * 60,
        answers: {},
        shuffledQuestions: sanitizedQuestions,
        activityLogs: [{ timestamp: new Date().toISOString(), event: 'Bắt đầu làm bài thi' }],
        status: 'in_progress',
      };

      sessions.push(newSession);
      this.saveLocalSessions(sessions);

      return {
        success: true,
        session: newSession,
        questions: sanitizedQuestions,
        examInfo: {
          title: exam.title,
          subject: exam.subject,
          grade: exam.grade,
          duration: exam.duration,
          totalPoints: exam.totalPoints,
          antiCheat: exam.antiCheat,
        },
      };
    }
  }

  // 8. Save Student Progress
  static async saveProgress(sessionId: string, answers: Record<string, any>, remainingSeconds: number) {
    try {
      return await this.request<{ success: boolean }>('/api/exam/save-progress', {
        method: 'POST',
        body: JSON.stringify({ sessionId, answers, remainingSeconds }),
      });
    } catch {
      const sessions = this.getLocalSessions();
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        sessions[idx].answers = { ...sessions[idx].answers, ...answers };
        sessions[idx].remainingSeconds = remainingSeconds;
        this.saveLocalSessions(sessions);
      }
      return { success: true };
    }
  }

  // 9. Submit Student Exam
  static async submitExam(sessionId: string, answers: Record<string, any>, remainingSeconds: number) {
    let submitRes: any = null;
    try {
      submitRes = await this.request<{
        success: boolean;
        result: {
          score: number;
          correctCount: number;
          incorrectCount: number;
          totalQuestions: number;
          startTime: string;
          submitTime: string;
          allowExplanations: boolean;
          detailedGrading: any[];
        };
      }>('/api/exam/submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId, answers, remainingSeconds }),
      });
    } catch (err: any) {
      if (
        err.message &&
        err.message !== 'SERVER_OFFLINE_OR_NON_JSON' &&
        !err.message.includes('Unexpected') &&
        !err.message.includes('JSON')
      ) {
        throw err;
      }
      const sessions = this.getLocalSessions();
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx === -1) {
        throw new Error('Không tìm thấy phiên làm bài.');
      }

      const session = sessions[idx];
      const examRes = await this.getExamDetail(session.examCode);
      const exam = examRes.exam;
      const originalQuestions = exam.examPackage?.exams?.[0]?.questions || [];

      let correctCount = 0;
      const totalQuestions = originalQuestions.length;
      const finalAnswers = { ...session.answers, ...answers };

      originalQuestions.forEach((q: any) => {
        const studentAns = finalAnswers[q.id];
        const correctAns = q.correctOption || q.correctAnswer;
        if (studentAns && String(studentAns).trim().toUpperCase() === String(correctAns).trim().toUpperCase()) {
          correctCount++;
        }
      });

      const score = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * exam.totalPoints).toFixed(2)) : 0;
      const submitTime = new Date().toISOString();

      session.answers = finalAnswers;
      session.remainingSeconds = remainingSeconds;
      session.submitTime = submitTime;
      session.status = 'submitted';
      session.score = score;
      session.correctCount = correctCount;
      session.incorrectCount = totalQuestions - correctCount;
      session.totalQuestions = totalQuestions;
      session.activityLogs.push({ timestamp: submitTime, event: 'Nộp bài thi hoàn tất' });

      sessions[idx] = session;
      this.saveLocalSessions(sessions);

      submitRes = {
        success: true,
        result: {
          score,
          correctCount,
          incorrectCount: totalQuestions - correctCount,
          totalQuestions,
          startTime: session.startTime,
          submitTime,
          allowExplanations: exam.allowExplanations,
          detailedGrading: [],
        },
      };
    }

    // Always sync result item to Firestore
    try {
      const sessions = this.getLocalSessions();
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        const tabSwitches = (session.activityLogs || []).filter((l: any) => l.event && l.event.includes('Chuyển tab')).length;
        const start = new Date(session.startTime).getTime();
        const end = session.submitTime ? new Date(session.submitTime).getTime() : Date.now();
        const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

        await this.syncStudentResultToFirestore({
          id: session.id,
          examCode: session.examCode,
          studentName: session.studentName,
          studentClass: session.studentClass,
          studentSbd: session.studentId,
          studentId: session.studentId,
          studentSchool: session.studentSchool,
          startTime: session.startTime,
          submitTime: session.submitTime || new Date().toISOString(),
          durationMinutes,
          score: session.score || 0,
          correctCount: session.correctCount || 0,
          incorrectCount: session.incorrectCount || 0,
          totalQuestions: session.totalQuestions || 0,
          tabSwitches,
          activityLogs: session.activityLogs || [],
        });
      }
    } catch (e) {
      console.warn('Lỗi sync student result to Firestore:', e);
    }

    return submitRes;
  }

  // 10. Log Activity (Anti-cheat)
  static async logActivity(sessionId: string, event: string, details?: string) {
    try {
      return await this.request<{ success: boolean }>('/api/exam/log-activity', {
        method: 'POST',
        body: JSON.stringify({ sessionId, event, details }),
      });
    } catch {
      const sessions = this.getLocalSessions();
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        sessions[idx].activityLogs.push({
          timestamp: new Date().toISOString(),
          event,
          details,
        });
        this.saveLocalSessions(sessions);
      }
      return { success: true };
    }
  }

  // 11. Get Teacher Results
  static async getTeacherResults(code: string = 'ALL') {
    const codeUpper = (code || 'ALL').trim().toUpperCase();
    let apiResults: StudentResultItem[] = [];
    try {
      const res = await this.request<{ success: boolean; results: StudentResultItem[] }>(
        `/api/teacher/results?code=${encodeURIComponent(codeUpper)}`
      );
      if (res.success && Array.isArray(res.results)) {
        apiResults = res.results;
      }
    } catch {
      // ignore
    }

    const sessions = this.getLocalSessions().filter((s) => s.status === 'submitted');
    const filteredLocal =
      codeUpper === 'ALL'
        ? sessions
        : sessions.filter((s) => s.examCode.toUpperCase() === codeUpper);

    const localResults: StudentResultItem[] = filteredLocal.map((s) => {
      const tabSwitches = (s.activityLogs || []).filter((l: any) => l.event && l.event.includes('Chuyển tab')).length;
      const start = new Date(s.startTime).getTime();
      const end = s.submitTime ? new Date(s.submitTime).getTime() : Date.now();
      const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

      return {
        id: s.id,
        examCode: s.examCode,
        studentName: s.studentName,
        studentClass: s.studentClass,
        studentSbd: s.studentId,
        studentId: s.studentId,
        studentSchool: s.studentSchool,
        startTime: s.startTime,
        submitTime: s.submitTime || undefined,
        durationMinutes,
        score: s.score || 0,
        correctCount: s.correctCount || 0,
        incorrectCount: s.incorrectCount || 0,
        totalQuestions: s.totalQuestions || 0,
        tabSwitches,
        activityLogs: s.activityLogs || [],
      };
    });

    const firestoreResults = await this.getStudentResultsFromFirestore(codeUpper);

    const map = new Map<string, StudentResultItem>();
    [...apiResults, ...firestoreResults, ...localResults].forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.submitTime || 0).getTime() - new Date(a.submitTime || 0).getTime()
    );

    return { success: true, results: merged };
  }

  // 12. Delete Student Result
  static async deleteResult(sessionId: string) {
    try {
      return await this.request<{ success: boolean; message: string }>(
        `/api/teacher/results/${encodeURIComponent(sessionId)}`,
        {
          method: 'DELETE',
        }
      );
    } catch {
      const sessions = this.getLocalSessions().filter((s) => s.id !== sessionId);
      this.saveLocalSessions(sessions);
      return { success: true, message: 'Đã xóa kết quả làm bài' };
    }
  }

  private static async syncClassToFirestore(cls: any): Promise<void> {
    if (!cls || !cls.id) return;
    try {
      const docRef = doc(db, 'system_classes', cls.id);
      await setDoc(
        docRef,
        {
          ...cls,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Lỗi đồng bộ class tới Firestore:', e);
    }
  }

  private static async syncStudentToFirestore(student: any): Promise<void> {
    if (!student || !student.id) return;
    try {
      const docRef = doc(db, 'system_students', student.id);
      const cleanSbd = student.sbd ? student.sbd.trim().toUpperCase() : '';
      await setDoc(
        docRef,
        {
          ...student,
          sbd: cleanSbd,
          sbdOriginal: student.sbd ? student.sbd.trim() : '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Lỗi đồng bộ student tới Firestore:', e);
    }
  }

  private static async getSystemClassesFromFirestore(): Promise<any[]> {
    try {
      const colRef = collection(db, 'system_classes');
      const snap = await getDocs(colRef);
      const items: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.id) {
          items.push(data);
        }
      });
      return items;
    } catch (e) {
      console.warn('Lỗi đọc system_classes từ Firestore:', e);
      return [];
    }
  }

  private static async getSystemStudentsFromFirestore(): Promise<any[]> {
    try {
      const colRef = collection(db, 'system_students');
      const snap = await getDocs(colRef);
      const items: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.id) {
          items.push(data);
        }
      });
      return items;
    } catch (e) {
      console.warn('Lỗi đọc system_students từ Firestore:', e);
      return [];
    }
  }

  // 13. Classes Management
  static async getClasses() {
    let apiClasses: any[] = [];
    try {
      const res = await this.request<{ success: boolean; classes: any[] }>('/api/classes');
      if (res.success && Array.isArray(res.classes)) {
        apiClasses = res.classes;
      }
    } catch {
      // ignore
    }

    const firestoreClasses = await this.getSystemClassesFromFirestore();
    const localClasses = this.getLocalClasses();

    const map = new Map<string, any>();
    [...apiClasses, ...firestoreClasses, ...localClasses].forEach((cls) => {
      if (cls && cls.id) {
        map.set(cls.id, cls);
      }
    });

    const merged = Array.from(map.values());

    if (localClasses.length > 0 || apiClasses.length > 0) {
      const firestoreIds = new Set(firestoreClasses.map((c) => c.id));
      const unSynced = [...apiClasses, ...localClasses].filter((c) => c && c.id && !firestoreIds.has(c.id));
      if (unSynced.length > 0) {
        unSynced.forEach((cls) => {
          this.syncClassToFirestore(cls).catch(() => {});
        });
      }
    }

    return { success: true, classes: merged };
  }

  static async saveClass(data: {
    id?: string;
    name: string;
    grade: string;
    schoolYear?: string;
    teacherName?: string;
    notes?: string;
  }) {
    let savedClass: any = null;
    try {
      const res = await this.request<{ success: boolean; class: any }>('/api/classes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.success && res.class) {
        savedClass = res.class;
      }
    } catch {
      // ignore
    }

    if (!savedClass) {
      const id = data.id || 'cls_' + Date.now();
      savedClass = { ...data, id, createdAt: new Date().toISOString() };
    }

    const classes = this.getLocalClasses();
    const updated = [savedClass, ...classes.filter((c) => c.id !== savedClass.id)];
    this.saveLocalClasses(updated);

    await this.syncClassToFirestore(savedClass);

    return { success: true, class: savedClass };
  }

  static async deleteClass(id: string) {
    try {
      await this.request<{ success: boolean }>(`/api/classes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }

    const classes = this.getLocalClasses().filter((c) => c.id !== id);
    this.saveLocalClasses(classes);

    try {
      const docRef = doc(db, 'system_classes', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Lỗi xóa system_classes từ Firestore:', e);
    }

    return { success: true };
  }

  // 14. Students Management
  static async getStudents(classId?: string) {
    let apiStudents: any[] = [];
    try {
      const queryStr = classId ? `?classId=${encodeURIComponent(classId)}` : '';
      const res = await this.request<{ success: boolean; students: any[] }>(`/api/students${queryStr}`);
      if (res.success && Array.isArray(res.students)) {
        apiStudents = res.students;
      }
    } catch {
      // ignore
    }

    const firestoreStudents = await this.getSystemStudentsFromFirestore();
    const localStudents = this.getLocalStudents();

    const map = new Map<string, any>();
    [...apiStudents, ...firestoreStudents, ...localStudents].forEach((s) => {
      if (s && s.id) {
        map.set(s.id, s);
      }
    });

    let allStudents = Array.from(map.values());

    if (localStudents.length > 0 || apiStudents.length > 0) {
      const firestoreIds = new Set(firestoreStudents.map((s) => s.id));
      const unSynced = [...apiStudents, ...localStudents].filter((s) => s && s.id && !firestoreIds.has(s.id));
      if (unSynced.length > 0) {
        unSynced.forEach((st) => {
          this.syncStudentToFirestore(st).catch(() => {});
        });
      }
    }

    if (classId) {
      allStudents = allStudents.filter((s) => s.classId === classId || s.className === classId);
    }

    return { success: true, students: allStudents };
  }

  static async saveStudents(students: any | any[]) {
    const list = Array.isArray(students) ? students : [students];
    let savedList: any[] = [];

    try {
      const res = await this.request<{ success: boolean; students: any[] }>('/api/students', {
        method: 'POST',
        body: JSON.stringify(students),
      });
      if (res.success && Array.isArray(res.students)) {
        savedList = res.students;
      }
    } catch {
      // ignore
    }

    if (savedList.length === 0) {
      savedList = list.map((s) => ({
        ...s,
        id: s.id || 'std_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: s.createdAt || new Date().toISOString(),
      }));
    }

    const existing = this.getLocalStudents();
    const existingMap = new Map(existing.map((s) => [s.id, s]));
    savedList.forEach((s) => existingMap.set(s.id, s));
    const updated = Array.from(existingMap.values());
    this.saveLocalStudents(updated);

    for (const st of savedList) {
      await this.syncStudentToFirestore(st);
    }

    return { success: true, students: savedList };
  }

  static async deleteStudent(id: string) {
    try {
      await this.request<{ success: boolean }>(`/api/students/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }

    const students = this.getLocalStudents().filter((s) => s.id !== id);
    this.saveLocalStudents(students);

    try {
      const docRef = doc(db, 'system_students', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Lỗi xóa system_students từ Firestore:', e);
    }

    return { success: true };
  }

  // 15. Lookup Student by SBD
  static async lookupStudentBySbd(sbd: string, code?: string) {
    const cleanSbd = (sbd || '').trim();
    const cleanSbdUpper = cleanSbd.toUpperCase();

    // 1. Try API
    try {
      const queryCode = code ? `&code=${encodeURIComponent(code)}` : '';
      const res = await this.request<{
        success: boolean;
        student: { id: string; sbd: string; name: string; className: string; school?: string };
      }>(`/api/exam/lookup-student?sbd=${encodeURIComponent(cleanSbd)}${queryCode}`);
      if (res.success && res.student) {
        return res;
      }
    } catch {
      // ignore API failure
    }

    // 2. Query Firestore & local students
    const studentsRes = await this.getStudents();
    const allStudents = studentsRes.students || [];

    const normSbdA = cleanSbdUpper.replace(/[^a-zA-Z0-9]/g, '');

    const student = allStudents.find((s) => {
      if (!s || !s.sbd) return false;
      const sbdVal = String(s.sbd).trim();
      const sbdValUpper = sbdVal.toUpperCase();
      const normSbdB = sbdValUpper.replace(/[^a-zA-Z0-9]/g, '');
      return sbdValUpper === cleanSbdUpper || sbdVal === cleanSbd || (normSbdA && normSbdA === normSbdB);
    });

    if (!student) {
      throw new Error(`Không tìm thấy học sinh với số báo danh '${cleanSbd}'.`);
    }

    // 3. Allowed classes check if exam code provided
    if (code) {
      try {
        const examRes = await this.getStudentExamInfo(code);
        if (
          examRes.success &&
          examRes.info &&
          Array.isArray(examRes.info.allowedClasses) &&
          examRes.info.allowedClasses.length > 0
        ) {
          const normalizeClass = (str: string) =>
            str ? str.trim().toLowerCase().replace(/^(lớp|lop|class)\s*/gi, '').replace(/[^a-z0-9]/gi, '') : '';
          const studentNorm = normalizeClass(student.className);
          const isAllowed = examRes.info.allowedClasses.some(
            (c: string) => normalizeClass(c) === studentNorm || c === student.classId
          );
          if (!isAllowed) {
            throw new Error(
              `Cảnh báo: Học sinh ${student.name} (Lớp ${student.className}) không thuộc danh sách lớp được phép làm bài thi này (${examRes.info.allowedClasses.join(', ')}). Vui lòng kiểm tra lại thông tin tên và lớp!`
            );
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('không thuộc danh sách lớp')) {
          throw err;
        }
      }
    }

    return {
      success: true,
      student: {
        id: student.id,
        sbd: student.sbd,
        name: student.name,
        className: student.className,
        school: student.notes || 'Trường THCS / THPT',
      },
    };
  }

  // 16. Reset Student Session (Allow Retake)
  static async resetStudentSession(data: {
    sessionId?: string;
    examCode?: string;
    sbd?: string;
    studentName?: string;
  }) {
    try {
      return await this.request<{ success: boolean; message: string }>('/api/exam/reset-student-session', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      let sessions = this.getLocalSessions();
      if (data.sessionId) {
        sessions = sessions.filter((s) => s.id !== data.sessionId);
      } else if (data.examCode && data.sbd) {
        sessions = sessions.filter(
          (s) =>
            !(
              s.examCode.toUpperCase() === data.examCode?.toUpperCase() &&
              s.studentId &&
              s.studentId.trim().toUpperCase() === data.sbd?.trim().toUpperCase()
            )
        );
      }
      this.saveLocalSessions(sessions);
      return { success: true, message: 'Đã xóa kết quả và cho phép học sinh làm lại bài thi.' };
    }
  }
}
