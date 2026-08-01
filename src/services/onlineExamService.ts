// Frontend API Client Service for Online Exam System

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
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi xử lý yêu cầu từ hệ thống.');
    }
    return data as T;
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
    return this.request<{ success: boolean; code: string; exam: any }>('/api/exam/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 2. List all exams for Teacher
  static async listExams() {
    return this.request<{ success: boolean; exams: OnlineExamItem[] }>('/api/exam/list');
  }

  // 3. Get Exam Detail
  static async getExamDetail(code: string) {
    return this.request<{ success: boolean; exam: any }>(`/api/exam/detail/${encodeURIComponent(code)}`);
  }

  // 4. Update Exam Status / Settings / Questions & Points
  static async updateExam(code: string, data: { status?: 'active' | 'locked'; allowExplanations?: boolean; duration?: number; antiCheat?: any; examPackage?: any; totalPoints?: number; title?: string }) {
    return this.request<{ success: boolean; exam: any }>(`/api/exam/update/${encodeURIComponent(code)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 5. Delete Exam
  static async deleteExam(code: string) {
    return this.request<{ success: boolean; message: string }>(`/api/exam/delete/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    });
  }

  // 6. Get Student Exam Public Info
  static async getStudentExamInfo(code: string) {
    return this.request<{
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
      };
    }>(`/api/exam/student-info/${encodeURIComponent(code)}`);
  }

  // 7. Start Student Exam Session
  static async startStudentExam(data: {
    code: string;
    studentName: string;
    studentClass: string;
    studentId?: string;
    studentSchool?: string;
  }) {
    return this.request<{
      success: boolean;
      isAlreadySubmitted?: boolean;
      isResume?: boolean;
      session: any;
      questions?: any[];
      examInfo?: any;
      result?: any;
    }>('/api/exam/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 8. Save Student Progress
  static async saveProgress(sessionId: string, answers: Record<string, any>, remainingSeconds: number) {
    return this.request<{ success: boolean }>('/api/exam/save-progress', {
      method: 'POST',
      body: JSON.stringify({ sessionId, answers, remainingSeconds }),
    });
  }

  // 9. Submit Student Exam
  static async submitExam(sessionId: string, answers: Record<string, any>, remainingSeconds: number) {
    return this.request<{
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
  }

  // 10. Log Activity (Anti-cheat)
  static async logActivity(sessionId: string, event: string, details?: string) {
    return this.request<{ success: boolean }>('/api/exam/log-activity', {
      method: 'POST',
      body: JSON.stringify({ sessionId, event, details }),
    });
  }

  // 11. Get Teacher Results
  static async getTeacherResults(code: string = 'ALL') {
    return this.request<{ success: boolean; results: StudentResultItem[] }>(
      `/api/teacher/results?code=${encodeURIComponent(code)}`
    );
  }

  // 12. Delete Student Result
  static async deleteResult(sessionId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/teacher/results/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  }

  // 13. Classes Management
  static async getClasses() {
    return this.request<{ success: boolean; classes: any[] }>('/api/classes');
  }

  static async saveClass(data: { id?: string; name: string; grade: string; schoolYear?: string; teacherName?: string; notes?: string }) {
    return this.request<{ success: boolean; class: any }>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteClass(id: string) {
    return this.request<{ success: boolean }>(`/api/classes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // 14. Students Management
  static async getStudents(classId?: string) {
    const query = classId ? `?classId=${encodeURIComponent(classId)}` : '';
    return this.request<{ success: boolean; students: any[] }>(`/api/students${query}`);
  }

  static async saveStudents(students: any | any[]) {
    return this.request<{ success: boolean; students: any[] }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(students),
    });
  }

  static async deleteStudent(id: string) {
    return this.request<{ success: boolean }>(`/api/students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // 15. Lookup Student by SBD
  static async lookupStudentBySbd(sbd: string, code?: string) {
    const queryCode = code ? `&code=${encodeURIComponent(code)}` : '';
    return this.request<{
      success: boolean;
      student: { id: string; sbd: string; name: string; className: string; school?: string };
    }>(`/api/exam/lookup-student?sbd=${encodeURIComponent(sbd)}${queryCode}`);
  }

  // 16. Reset Student Session (Allow Retake)
  static async resetStudentSession(data: {
    sessionId?: string;
    examCode?: string;
    sbd?: string;
    studentName?: string;
  }) {
    return this.request<{ success: boolean; message: string }>('/api/exam/reset-student-session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
