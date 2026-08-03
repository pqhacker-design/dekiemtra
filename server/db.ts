import fs from 'fs';
import path from 'path';

export interface ExamData {
  id: string;
  code: string; // e.g. "A7X92Q"
  title: string;
  subject: string;
  grade: string;
  duration: number; // in minutes, e.g. 45
  totalPoints: number; // e.g. 10.0
  topic?: string;
  createdDate: string; // ISO string
  status: 'active' | 'locked';
  allowExplanations: boolean; // allow students to see solutions after submit
  allowedClasses?: string[]; // Danh sách các lớp được làm bài (VD: ["10A1", "10A2"])
  createdBy?: string;
  antiCheat: {
    disallowPrevious: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    autoSubmitOnTimeout: boolean;
    warnTabSwitch: boolean;
    tabSwitchLimit: number;
  };
  examPackage: any; // Full ExamPackage object (questions, matrix, spec)
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
  createdBy?: string;
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
  createdBy?: string;
  createdAt?: string;
}

export interface ActivityLogItem {
  timestamp: string;
  event: string; // e.g., "Bắt đầu làm bài", "Chuyển tab lần 1"
  details?: string;
}

export interface StudentSession {
  id: string;
  examCode: string;
  studentName: string;
  studentClass: string;
  studentId?: string; // Số báo danh / Mã học sinh để tránh trùng tên
  studentSchool?: string;
  seed: string;
  startTime: string; // ISO string
  submitTime?: string | null; // ISO string
  remainingSeconds: number;
  answers: Record<string, any>; // questionId -> student answer
  score?: number | null;
  correctCount?: number | null;
  incorrectCount?: number | null;
  totalQuestions?: number;
  shuffledQuestions?: any[]; // The customized paper generated for this student seed
  originalAnswersMap?: Record<string, any>; // Grading reference map for shuffled paper
  activityLogs: ActivityLogItem[];
  status: 'in_progress' | 'submitted';
}

const DATA_DIR = path.join(process.cwd(), 'data');
const EXAMS_FILE = path.join(DATA_DIR, 'exams.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Lỗi đọc file ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Lỗi ghi file ${filePath}:`, err);
  }
}

export const sampleInitialExams: ExamData[] = [
  {
    id: 'exam_sample_1',
    code: 'TOAN10',
    title: 'Đề kiểm tra Giữa Học kỳ I - Toán 10 (Chuẩn CV 7991)',
    subject: 'Toán',
    grade: 'Khối 10',
    duration: 45,
    totalPoints: 10.0,
    topic: 'Hàm số bậc hai và Phương trình bậc hai',
    createdDate: new Date().toISOString(),
    status: 'active',
    allowExplanations: true,
    antiCheat: {
      disallowPrevious: false,
      shuffleQuestions: true,
      shuffleOptions: true,
      autoSubmitOnTimeout: true,
      warnTabSwitch: true,
      tabSwitchLimit: 3,
    },
    examPackage: {
      id: 'pkg_sample_1',
      createdAt: new Date().toISOString(),
      metadata: {
        schoolName: 'Trường THCS Bình San',
        departmentName: 'Sở Giáo dục và Đào tạo',
        subject: 'Toán',
        grade: 'Khối 10',
        className: '10A1',
        semester: 'Học kỳ I',
        schoolYear: '2025 - 2026',
        examTitle: 'Đề kiểm tra Giữa Học kỳ I - Toán 10',
        chapterTitle: 'Hàm số bậc hai và Phương trình bậc hai',
        durationMinutes: 45,
        totalPoints: 10.0,
        curriculum: 'Kết nối tri thức với cuộc sống',
        examMode: 'MCQ_ESSAY',
      },
      exams: [
        {
          code: '101',
          questions: [
            {
              id: 'q-sample-1',
              number: 1,
              partType: 'PART1',
              partTitle: 'PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn',
              content: 'Tập xác định của hàm số $y = \\sqrt{x - 2}$ là:',
              cognitiveLevel: 'REMEMBER',
              points: 0.25,
              options: [
                { key: 'A', content: '$D = [2; +\\infty)$' },
                { key: 'B', content: '$D = (2; +\\infty)$' },
                { key: 'C', content: '$D = (-\\infty; 2]$' },
                { key: 'D', content: '$D = \\mathbb{R} \\setminus \\{2\\}$' },
              ],
              correctOption: 'A',
              correctAnswer: 'A',
              explanation: 'Biểu thức dưới dấu căn không âm: $x - 2 \\ge 0 \\Leftrightarrow x \\ge 2$. Vậy tập xác định $D = [2; +\\infty)$.',
            },
            {
              id: 'q-sample-2',
              number: 2,
              partType: 'PART1',
              partTitle: 'PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn',
              content: 'Tọa độ đỉnh $I$ của parabol $y = x^2 - 4x + 3$ là:',
              cognitiveLevel: 'UNDERSTAND',
              points: 0.25,
              options: [
                { key: 'A', content: '$I(2; -1)$' },
                { key: 'B', content: '$I(-2; 15)$' },
                { key: 'C', content: '$I(4; 3)$' },
                { key: 'D', content: '$I(-2; -1)$' },
              ],
              correctOption: 'A',
              correctAnswer: 'A',
              explanation: '$x_I = -b/(2a) = 4/2 = 2$. $y_I = 2^2 - 4(2) + 3 = -1$. Vậy $I(2; -1)$.',
            },
            {
              id: 'q-sample-3',
              number: 3,
              partType: 'PART2',
              partTitle: 'PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai',
              content: 'Cho hàm số $y = f(x) = x^2 - 2x - 3$. Xét tính đúng/sai của các khẳng định sau:',
              cognitiveLevel: 'UNDERSTAND',
              points: 1.0,
              trueFalseStatements: [
                { key: 'a', content: 'Đồ thị hàm số là một parabol quay bề lõm lên trên.', isCorrect: true },
                { key: 'b', content: 'Trục đối xứng của parabol là đường thẳng $x = 1$.', isCorrect: true },
                { key: 'c', content: 'Hàm số đồng biến trên khoảng $(-\\infty; 1)$.', isCorrect: false },
                { key: 'd', content: 'Giá trị nhỏ nhất của hàm số bằng $-4$.', isCorrect: true },
              ],
              explanation: 'a) $a = 1 > 0$ nên bề lõm quay lên. b) Trục đối xứng $x = -b/(2a) = 1$. c) Đồng biến trên $(1; +\\infty)$. d) $y_{min} = -4$.',
            },
            {
              id: 'q-sample-4',
              number: 4,
              partType: 'PART3',
              partTitle: 'PHẦN III. Câu hỏi trả lời ngắn',
              content: 'Cho phương trình $x^2 - 2(m-1)x + m^2 - 3 = 0$. Tìm giá trị của $m$ để phương trình có nghiệm kép.',
              cognitiveLevel: 'APPLY',
              points: 0.25,
              shortAnswer: '2',
              explanation: 'Phương trình có nghiệm kép $\\Leftrightarrow \\Delta\' = 0 \\Leftrightarrow (m-1)^2 - (m^2-3) = 0 \\Leftrightarrow -2m + 4 = 0 \\Leftrightarrow m = 2$.',
            },
            {
              id: 'q-sample-5',
              number: 5,
              partType: 'PART4',
              partTitle: 'PHẦN IV. Tự luận',
              content: 'Một cổng hình parabol có chiều rộng $AB = 8\\text{m}$ và chiều cao $h = 6\\text{m}$. Hãy lập phương trình đồ thị parabol biểu diễn chiếc cổng và tính chiều cao của cổng tại vị trí cách chân cổng $2\\text{m}$.',
              cognitiveLevel: 'ADVANCED',
              points: 2.0,
              essayAnswerGuide: '1. Chọn hệ trục tọa độ $Oxy$ với gốc $O$ là trung điểm chân cổng $AB$, suy ra $A(-4;0), B(4;0)$ và đỉnh $I(0;6)$.\n2. Parabol có dạng $y = ax^2 + 6$. Vì đi qua $B(4;0)$ nên $16a + 6 = 0 \\Rightarrow a = -3/8$.\n3. Tọa độ parabol: $y = -\\frac{3}{8}x^2 + 6$.\n4. Tại vị trí cách chân cổng $2\\text{m}$, ứng với $x = 2$, suy ra $y = -\\frac{3}{8}(2^2) + 6 = 4.5\\text{m}$.',
            },
          ],
        },
      ],
      answerKeys: [
        {
          code: '101',
          part1Answers: [
            { questionNumber: 1, correctOption: 'A', points: 0.25 },
            { questionNumber: 2, correctOption: 'A', points: 0.25 },
          ],
          part2Answers: [
            {
              questionNumber: 3,
              statements: [
                { key: 'a', isCorrect: true },
                { key: 'b', isCorrect: true },
                { key: 'c', isCorrect: false },
                { key: 'd', isCorrect: true },
              ],
              points: 1.0,
            },
          ],
          part3Answers: [{ questionNumber: 4, shortAnswer: '2', points: 0.25 }],
          part4Answers: [
            {
              questionNumber: 5,
              essayAnswerGuide: 'Chọn hệ trục Oxy...',
              points: 2.0,
            },
          ],
        },
      ],
    },
  },
];

export class ExamRepository {
  // --- EXAMS ---
  static getExams(userId?: string): ExamData[] {
    const exams = readJsonFile<ExamData[]>(EXAMS_FILE, sampleInitialExams);
    if (!userId) return exams;
    return exams.filter((e) => e.createdBy === userId || !e.createdBy);
  }

  static getExamByCode(code: string): ExamData | undefined {
    const exams = readJsonFile<ExamData[]>(EXAMS_FILE, sampleInitialExams);
    return exams.find((e) => e.code.toUpperCase() === code.toUpperCase());
  }

  static saveExam(exam: ExamData, userId?: string): ExamData {
    if (userId && !exam.createdBy) {
      exam.createdBy = userId;
    }
    const exams = readJsonFile<ExamData[]>(EXAMS_FILE, sampleInitialExams);
    const index = exams.findIndex((e) => e.code.toUpperCase() === exam.code.toUpperCase());
    if (index >= 0) {
      exams[index] = { ...exams[index], ...exam };
    } else {
      exams.unshift(exam);
    }
    writeJsonFile(EXAMS_FILE, exams);
    return exam;
  }

  static updateExamStatus(code: string, status: 'active' | 'locked'): ExamData | undefined {
    const exams = readJsonFile<ExamData[]>(EXAMS_FILE, sampleInitialExams);
    const exam = exams.find((e) => e.code.toUpperCase() === code.toUpperCase());
    if (exam) {
      exam.status = status;
      writeJsonFile(EXAMS_FILE, exams);
    }
    return exam;
  }

  static deleteExam(code: string): boolean {
    let exams = readJsonFile<ExamData[]>(EXAMS_FILE, sampleInitialExams);
    const initialLen = exams.length;
    exams = exams.filter((e) => e.code.toUpperCase() !== code.toUpperCase());
    if (exams.length !== initialLen) {
      writeJsonFile(EXAMS_FILE, exams);
      return true;
    }
    return false;
  }

  // --- STUDENT SESSIONS ---
  static getSessions(): StudentSession[] {
    return readJsonFile<StudentSession[]>(SESSIONS_FILE, []);
  }

  static getSessionById(sessionId: string): StudentSession | undefined {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === sessionId);
  }

  static findStudentSession(
    examCode: string,
    studentName: string,
    studentClass: string,
    studentId?: string
  ): StudentSession | undefined {
    const sessions = this.getSessions();
    const normCode = examCode.trim().toUpperCase();
    const normName = studentName.trim().toLowerCase();
    const normClass = studentClass.trim().toLowerCase();
    const normId = (studentId || '').trim().toLowerCase();

    return sessions.find((s) => {
      if (s.examCode.toUpperCase() !== normCode) return false;

      // Match by studentId if provided
      if (normId && s.studentId && s.studentId.trim().toLowerCase() === normId) {
        return true;
      }

      // Default match by studentName + studentClass
      return (
        s.studentName.trim().toLowerCase() === normName &&
        s.studentClass.trim().toLowerCase() === normClass
      );
    });
  }

  static saveSession(session: StudentSession): StudentSession {
    const sessions = this.getSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    writeJsonFile(SESSIONS_FILE, sessions);
    return session;
  }

  static deleteSession(sessionId: string): boolean {
    let sessions = this.getSessions();
    const initialLen = sessions.length;
    sessions = sessions.filter((s) => s.id !== sessionId);
    if (sessions.length !== initialLen) {
      writeJsonFile(SESSIONS_FILE, sessions);
      return true;
    }
    return false;
  }

  static getResultsByExamCode(examCode?: string, userId?: string): StudentSession[] {
    const sessions = this.getSessions();
    const exams = readJsonFile<ExamData[]>(EXAMS_FILE, sampleInitialExams);
    let filteredExams = exams;
    if (userId) {
      filteredExams = exams.filter((e) => e.createdBy === userId || !e.createdBy);
    }
    const userExamCodes = new Set(filteredExams.map((e) => e.code.toUpperCase()));

    return sessions.filter((s) => {
      if (s.status !== 'submitted') return false;
      if (userId && !userExamCodes.has(s.examCode.toUpperCase())) return false;
      if (!examCode || examCode === 'ALL') return true;
      return s.examCode.toUpperCase() === examCode.toUpperCase();
    });
  }
}

export const sampleInitialClasses: ClassItem[] = [
  { id: 'cls_10a1', name: '10A1', grade: 'Khối 10', schoolYear: '2025 - 2026', teacherName: 'Nguyễn Văn Minh', notes: 'Lớp Chuyên Toán' },
  { id: 'cls_10a2', name: '10A2', grade: 'Khối 10', schoolYear: '2025 - 2026', teacherName: 'Trần Thị Thu', notes: 'Lớp Chuẩn' },
  { id: 'cls_11b1', name: '11B1', grade: 'Khối 11', schoolYear: '2025 - 2026', teacherName: 'Lê Hoàng Nam', notes: 'Lớp Nâng cao' },
];

export const sampleInitialStudents: StudentItem[] = [
  { id: 'std_1', classId: 'cls_10a1', className: '10A1', sbd: '10A101', name: 'Nguyễn Văn An', gender: 'Nam', dob: '15/05/2009' },
  { id: 'std_2', classId: 'cls_10a1', className: '10A1', sbd: '10A102', name: 'Trần Thị Bình', gender: 'Nữ', dob: '20/08/2009' },
  { id: 'std_3', classId: 'cls_10a1', className: '10A1', sbd: '10A103', name: 'Lê Hoàng Cường', gender: 'Nam', dob: '10/01/2009' },
  { id: 'std_4', classId: 'cls_10a1', className: '10A1', sbd: '10A104', name: 'Phạm Minh Dung', gender: 'Nữ', dob: '03/11/2009' },
  { id: 'std_5', classId: 'cls_10a1', className: '10A1', sbd: '10A105', name: 'Hoàng Quốc Em', gender: 'Nam', dob: '25/07/2009' },

  { id: 'std_6', classId: 'cls_10a2', className: '10A2', sbd: '10A201', name: 'Vũ Thanh Giang', gender: 'Nữ', dob: '12/04/2009' },
  { id: 'std_7', classId: 'cls_10a2', className: '10A2', sbd: '10A202', name: 'Đặng Quốc Hùng', gender: 'Nam', dob: '18/09/2009' },
  { id: 'std_8', classId: 'cls_10a2', className: '10A2', sbd: '10A203', name: 'Bùi Thị Hương', gender: 'Nữ', dob: '05/02/2009' },
  { id: 'std_9', classId: 'cls_10a2', className: '10A2', sbd: '10A204', name: 'Đỗ Văn Khánh', gender: 'Nam', dob: '30/12/2009' },

  { id: 'std_10', classId: 'cls_11b1', className: '11B1', sbd: '11B101', name: 'Nông Thị Linh', gender: 'Nữ', dob: '14/03/2008' },
  { id: 'std_11', classId: 'cls_11b1', className: '11B1', sbd: '11B102', name: 'Ngô Đức Mạnh', gender: 'Nam', dob: '22/06/2008' },
  { id: 'std_12', classId: 'cls_11b1', className: '11B1', sbd: '11B103', name: 'Dương Thu Ngọc', gender: 'Nữ', dob: '11/10/2008' },
  { id: 'std_13', classId: 'cls_11b1', className: '11B1', sbd: '11B104', name: 'Hồ Tuấn Phương', gender: 'Nam', dob: '08/01/2008' },
];

export class ClassRepository {
  static getClasses(userId?: string): ClassItem[] {
    let classes = readJsonFile<ClassItem[]>(CLASSES_FILE, sampleInitialClasses);
    if (userId) {
      classes = classes.filter((c) => c.createdBy === userId || !c.createdBy);
    }
    const students = this.getStudents(undefined, userId);
    return classes.map((cls) => ({
      ...cls,
      studentCount: students.filter(
        (s) => s.classId === cls.id || s.className.trim().toLowerCase() === cls.name.trim().toLowerCase()
      ).length,
    }));
  }

  static saveClass(classItem: ClassItem, userId?: string): ClassItem {
    if (userId && !classItem.createdBy) {
      classItem.createdBy = userId;
    }
    const classes = readJsonFile<ClassItem[]>(CLASSES_FILE, sampleInitialClasses);
    const idx = classes.findIndex(
      (c) => c.id === classItem.id || (c.name && classItem.name && c.name.trim().toLowerCase() === classItem.name.trim().toLowerCase())
    );
    if (idx >= 0) {
      classes[idx] = { ...classes[idx], ...classItem };
    } else {
      classes.push(classItem);
    }
    writeJsonFile(CLASSES_FILE, classes);
    return classItem;
  }

  static deleteClass(id: string): boolean {
    let classes = readJsonFile<ClassItem[]>(CLASSES_FILE, sampleInitialClasses);
    const targetClass = classes.find((c) => c.id === id || c.name.trim().toLowerCase() === id.trim().toLowerCase());
    const targetName = targetClass ? targetClass.name.trim().toLowerCase() : id.trim().toLowerCase();
    const targetId = id.trim().toLowerCase();

    classes = classes.filter((c) => c.id !== id && c.name.trim().toLowerCase() !== targetName);
    writeJsonFile(CLASSES_FILE, classes);

    let students = readJsonFile<StudentItem[]>(STUDENTS_FILE, sampleInitialStudents);
    students = students.filter(
      (s) =>
        s.classId !== id &&
        s.classId !== targetClass?.id &&
        (s.className || '').trim().toLowerCase() !== targetName &&
        (s.className || '').trim().toLowerCase() !== targetId
    );
    writeJsonFile(STUDENTS_FILE, students);

    return true;
  }

  static getStudents(classIdOrName?: string, userId?: string): StudentItem[] {
    let students = readJsonFile<StudentItem[]>(STUDENTS_FILE, sampleInitialStudents);
    if (userId) {
      students = students.filter((s) => s.createdBy === userId || !s.createdBy);
    }
    if (!classIdOrName || classIdOrName === 'ALL') return students;
    const norm = classIdOrName.trim().toLowerCase();
    return students.filter(
      (s) => s.classId === classIdOrName || s.className.trim().toLowerCase() === norm
    );
  }

  static saveStudents(newStudents: StudentItem[], userId?: string): StudentItem[] {
    const students = readJsonFile<StudentItem[]>(STUDENTS_FILE, sampleInitialStudents);
    newStudents.forEach((st) => {
      if (userId && !st.createdBy) {
        st.createdBy = userId;
      }
      const idx = students.findIndex(
        (s) => s.id === st.id || (s.sbd && st.sbd && s.sbd.trim().toLowerCase() === st.sbd.trim().toLowerCase())
      );
      if (idx >= 0) {
        students[idx] = { ...students[idx], ...st };
      } else {
        students.push(st);
      }
    });
    writeJsonFile(STUDENTS_FILE, students);
    return newStudents;
  }

  static deleteStudent(id: string): boolean {
    let students = readJsonFile<StudentItem[]>(STUDENTS_FILE, sampleInitialStudents);
    const initialLen = students.length;
    students = students.filter((s) => s.id !== id);
    if (students.length !== initialLen) {
      writeJsonFile(STUDENTS_FILE, students);
      return true;
    }
    return false;
  }

  static findStudentBySbd(sbd: string): StudentItem | undefined {
    if (!sbd) return undefined;
    const normSbd = sbd.trim().toLowerCase();
    const students = readJsonFile<StudentItem[]>(STUDENTS_FILE, sampleInitialStudents);
    return students.find((s) => s.sbd && s.sbd.trim().toLowerCase() === normSbd);
  }
}
