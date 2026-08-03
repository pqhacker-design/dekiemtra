import express, { Request, Response } from 'express';
import {
  ExamRepository,
  ClassRepository,
  ExamData,
  StudentSession,
  ActivityLogItem,
  ClassItem,
  StudentItem,
} from './db';
import { generateShuffledExamPaper } from './shuffle';

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, 1, I
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function sanitizeQuestionsForStudent(questions: any[], allowExplanations = false): any[] {
  return questions.map((q) => {
    const cleanQ = { ...q };
    delete cleanQ.correctAnswer;
    delete cleanQ.correctOption;
    delete cleanQ.shortAnswer;
    delete cleanQ.essayAnswerGuide;
    delete cleanQ.rubric;

    if (!allowExplanations) {
      delete cleanQ.explanation;
    }

    if (Array.isArray(cleanQ.trueFalseStatements)) {
      cleanQ.trueFalseStatements = cleanQ.trueFalseStatements.map((st: any) => {
        const cleanSt = { ...st };
        delete cleanSt.isTrue;
        delete cleanSt.isCorrect;
        if (!allowExplanations) {
          delete cleanSt.explanation;
        }
        return cleanSt;
      });
    }
    return cleanQ;
  });
}

function normalizeString(str: any): string {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '.') // Convert commas in numbers to dots
    .replace(/\$/g, ''); // Strip LaTeX dollar signs for comparison
}

function evaluateStudentSessionResult(session: StudentSession, exam: ExamData) {
  const questions = session.shuffledQuestions || [];
  const answersMap = session.originalAnswersMap || {};
  const finalAnswers = session.answers || {};

  let totalEarnedScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let totalQuestionsCount = questions.length;

  const detailedGrading: any[] = [];

  for (const q of questions) {
    const studentAns = finalAnswers[q.id];
    const correctVal = answersMap[q.id];
    const pt = Number(q.points) || 0.25;

    let isCorrect = false;
    let earnedPoints = 0;

    if (q.partType === 'PART1' || !q.partType) {
      if (studentAns && String(studentAns).toUpperCase() === String(correctVal).toUpperCase()) {
        isCorrect = true;
        earnedPoints = pt;
        correctCount++;
      } else {
        incorrectCount++;
      }
      totalEarnedScore += earnedPoints;

      detailedGrading.push({
        questionId: q.id,
        questionNumber: q.number,
        partType: q.partType || 'PART1',
        studentAnswer: studentAns || 'Chưa trả lời',
        correctAnswer: correctVal,
        isCorrect,
        points: earnedPoints,
        maxPoints: pt,
        content: q.content,
        options: q.options,
        explanation: q.explanation || q.solution || q.explain || q.guide || q.explanationText || '',
      });
    } else if (q.partType === 'PART2') {
      const tfCorrectMap: Record<string, boolean> = correctVal || {};
      const studentTfMap: Record<string, boolean> = studentAns || {};

      let correctStatementsCount = 0;
      const statementsCount = Array.isArray(q.trueFalseStatements) ? q.trueFalseStatements.length : 4;

      if (Array.isArray(q.trueFalseStatements)) {
        q.trueFalseStatements.forEach((st: any) => {
          if (studentTfMap[st.key] === tfCorrectMap[st.key]) {
            correctStatementsCount++;
          }
        });
      }

      if (correctStatementsCount === 1) earnedPoints = 0.1 * (pt / 1.0);
      else if (correctStatementsCount === 2) earnedPoints = 0.25 * (pt / 1.0);
      else if (correctStatementsCount === 3) earnedPoints = 0.5 * (pt / 1.0);
      else if (correctStatementsCount === 4) earnedPoints = pt;

      if (correctStatementsCount === statementsCount) {
        isCorrect = true;
        correctCount++;
      } else if (correctStatementsCount > 0) {
        correctCount += 0.5;
        incorrectCount += 0.5;
      } else {
        incorrectCount++;
      }

      totalEarnedScore += earnedPoints;

      detailedGrading.push({
        questionId: q.id,
        questionNumber: q.number,
        partType: 'PART2',
        studentAnswer: studentTfMap,
        correctAnswer: tfCorrectMap,
        isCorrect: correctStatementsCount === statementsCount,
        correctStatementsCount,
        points: earnedPoints,
        maxPoints: pt,
        content: q.content,
        trueFalseStatements: q.trueFalseStatements,
        explanation: q.explanation || q.solution || q.explain || q.guide || q.explanationText || '',
      });
    } else if (q.partType === 'PART3') {
      const normStudent = normalizeString(studentAns);
      const normCorrect = normalizeString(correctVal);

      if (normStudent && normStudent === normCorrect) {
        isCorrect = true;
        earnedPoints = pt;
        correctCount++;
      } else {
        incorrectCount++;
      }

      totalEarnedScore += earnedPoints;

      detailedGrading.push({
        questionId: q.id,
        questionNumber: q.number,
        partType: 'PART3',
        studentAnswer: studentAns || 'Chưa trả lời',
        correctAnswer: correctVal,
        isCorrect,
        points: earnedPoints,
        maxPoints: pt,
        content: q.content,
        explanation: q.explanation || q.solution || q.explain || q.guide || q.explanationText || '',
      });
    } else if (q.partType === 'PART4') {
      detailedGrading.push({
        questionId: q.id,
        questionNumber: q.number,
        partType: 'PART4',
        studentAnswer: studentAns || 'Chưa trả lời',
        correctAnswer: correctVal?.essayAnswerGuide || 'Xem hướng dẫn chấm',
        rubric: correctVal?.rubric,
        points: 0,
        maxPoints: pt,
        content: q.content,
        essayAnswerGuide: correctVal?.essayAnswerGuide,
        explanation: q.explanation || q.solution || q.explain || q.guide || q.essayAnswerGuide || '',
      });
    }
  }

  const finalScore = Math.min(10.0, Math.round(totalEarnedScore * 100) / 100);

  return {
    score: session.score !== undefined && session.score !== null ? session.score : finalScore,
    correctCount: session.correctCount !== undefined && session.correctCount !== null ? session.correctCount : Math.floor(correctCount),
    incorrectCount: session.incorrectCount !== undefined && session.incorrectCount !== null ? session.incorrectCount : Math.floor(incorrectCount),
    totalQuestions: totalQuestionsCount,
    startTime: session.startTime,
    submitTime: session.submitTime || new Date().toISOString(),
    allowExplanations: exam?.allowExplanations !== false,
    detailedGrading,
  };
}

export function registerExamRoutes(app: express.Express) {
  // 1. Save or Create Exam
  app.post('/api/exam/save', (req: Request, res: Response) => {
    try {
      const {
        code: inputCode,
        title,
        subject,
        grade,
        duration,
        totalPoints,
        topic,
        allowExplanations,
        allowedClasses,
        antiCheat,
        examPackage,
      } = req.body;

      if (!examPackage || !examPackage.exams || examPackage.exams.length === 0) {
        return res.status(400).json({ error: 'Dữ liệu đề thi không hợp lệ.' });
      }

      let code = (inputCode || '').trim().toUpperCase();
      if (!code) {
        let attempts = 0;
        do {
          code = generateRandomCode();
          attempts++;
        } while (ExamRepository.getExamByCode(code) && attempts < 10);
      }

      const examData: ExamData = {
        id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        code,
        title: title || examPackage.metadata?.examTitle || examPackage.metadata?.title || 'Đề kiểm tra',
        subject: subject || examPackage.metadata?.subject || 'Toán',
        grade: grade || examPackage.metadata?.grade || 'Khối 10',
        duration: Number(duration) || examPackage.metadata?.durationMinutes || 45,
        totalPoints: Number(totalPoints) || examPackage.metadata?.totalPoints || 10.0,
        topic: topic || examPackage.metadata?.chapterTitle || '',
        createdDate: new Date().toISOString(),
        status: 'active',
        allowExplanations: allowExplanations !== false,
        allowedClasses: Array.isArray(allowedClasses) ? allowedClasses : [],
        antiCheat: {
          disallowPrevious: !!antiCheat?.disallowPrevious,
          shuffleQuestions: antiCheat?.shuffleQuestions !== false,
          shuffleOptions: antiCheat?.shuffleOptions !== false,
          autoSubmitOnTimeout: antiCheat?.autoSubmitOnTimeout !== false,
          warnTabSwitch: antiCheat?.warnTabSwitch !== false,
          tabSwitchLimit: Number(antiCheat?.tabSwitchLimit) || 3,
        },
        examPackage,
      };

      const saved = ExamRepository.saveExam(examData);
      return res.json({ success: true, code: saved.code, exam: saved });
    } catch (err: any) {
      console.error('Lỗi khi lưu đề thi:', err);
      return res.status(500).json({ error: 'Không thể lưu đề thi: ' + err.message });
    }
  });

  // --- CLASS & STUDENT MANAGEMENT ROUTES ---
  app.get('/api/classes', (req: Request, res: Response) => {
    try {
      const classes = ClassRepository.getClasses();
      return res.json({ success: true, classes });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi lấy danh sách lớp: ' + err.message });
    }
  });

  app.post('/api/classes', (req: Request, res: Response) => {
    try {
      const { id, name, grade, schoolYear, teacherName, notes } = req.body;
      if (!name || !grade) {
        return res.status(400).json({ error: 'Vui lòng điền Tên lớp và Khối lớp.' });
      }
      const classItem: ClassItem = {
        id: id || 'cls_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        grade: grade.trim(),
        schoolYear: (schoolYear || '2025 - 2026').trim(),
        teacherName: (teacherName || '').trim(),
        notes: (notes || '').trim(),
        createdAt: new Date().toISOString(),
      };
      const saved = ClassRepository.saveClass(classItem);
      return res.json({ success: true, class: saved });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi lưu lớp học: ' + err.message });
    }
  });

  app.delete('/api/classes/:id', (req: Request, res: Response) => {
    try {
      const deleted = ClassRepository.deleteClass(req.params.id);
      return res.json({ success: deleted });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi xóa lớp học: ' + err.message });
    }
  });

  app.get('/api/students', (req: Request, res: Response) => {
    try {
      const classId = req.query.classId as string;
      const students = ClassRepository.getStudents(classId);
      return res.json({ success: true, students });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi lấy danh sách học sinh: ' + err.message });
    }
  });

  app.post('/api/students', (req: Request, res: Response) => {
    try {
      const body = req.body;
      const list: StudentItem[] = Array.isArray(body) ? body : [body];
      const prepared = list.map((st, idx) => ({
        id: st.id || 'std_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
        classId: st.classId || '',
        className: st.className || '',
        sbd: (st.sbd || '').trim(),
        name: (st.name || '').trim(),
        gender: st.gender,
        dob: st.dob,
        notes: st.notes,
        createdAt: new Date().toISOString(),
      }));
      const saved = ClassRepository.saveStudents(prepared);
      return res.json({ success: true, students: saved });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi lưu danh sách học sinh: ' + err.message });
    }
  });

  app.delete('/api/students/:id', (req: Request, res: Response) => {
    try {
      const deleted = ClassRepository.deleteStudent(req.params.id);
      return res.json({ success: deleted });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi xóa học sinh: ' + err.message });
    }
  });

  app.get('/api/exam/lookup-student', (req: Request, res: Response) => {
    try {
      const sbd = ((req.query.sbd as string) || '').trim();
      const code = ((req.query.code as string) || '').trim();

      if (!sbd) {
        return res.status(400).json({ error: 'Vui lòng nhập Số báo danh.' });
      }

      const student = ClassRepository.findStudentBySbd(sbd);
      if (!student) {
        return res.status(404).json({ error: `Không tìm thấy học sinh có SBD: ${sbd}` });
      }

      if (code) {
        const normalizeClass = (str: string) =>
          str ? str.trim().toLowerCase().replace(/^(lớp|lop|class)\s*/gi, '').replace(/[^a-z0-9]/gi, '') : '';

        const exam = ExamRepository.getExamByCode(code);
        if (exam && Array.isArray(exam.allowedClasses) && exam.allowedClasses.length > 0) {
          const studentNorm = normalizeClass(student.className);
          const isAllowed = exam.allowedClasses.some(
            (c) => normalizeClass(c) === studentNorm || c === student.classId
          );
          if (!isAllowed) {
            return res.status(403).json({
              error: `Cảnh báo: Học sinh ${student.name} (Lớp ${student.className}) không thuộc danh sách lớp được phép làm bài thi này (${exam.allowedClasses.join(', ')}). Vui lòng kiểm tra lại thông tin tên và lớp!`,
              student,
            });
          }
        }
      }

      return res.json({
        success: true,
        student: {
          id: student.id,
          sbd: student.sbd,
          name: student.name,
          className: student.className,
          school: 'Trường THCS/THPT',
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi tra cứu SBD: ' + err.message });
    }
  });

  // Alias POST /api/exam/create
  app.post('/api/exam/create', (req: Request, res: Response) => {
    // Forward to save logic
    return (app as any)._router.handle({ ...req, url: '/api/exam/save', method: 'POST' }, res);
  });

  // 2. List all exams
  app.get('/api/exam/list', (req: Request, res: Response) => {
    try {
      const exams = ExamRepository.getExams();
      const sessions = ExamRepository.getSessions();

      const result = exams.map((exam) => {
        const examSessions = sessions.filter(
          (s) => s.examCode.toUpperCase() === exam.code.toUpperCase()
        );
        const submittedCount = examSessions.filter((s) => s.status === 'submitted').length;
        return {
          id: exam.id,
          code: exam.code,
          title: exam.title,
          subject: exam.subject,
          grade: exam.grade,
          duration: exam.duration,
          totalPoints: exam.totalPoints,
          createdDate: exam.createdDate,
          status: exam.status,
          questionCount: exam.examPackage?.exams?.[0]?.questions?.length || 0,
          submissionCount: submittedCount,
          activeSessionCount: examSessions.length - submittedCount,
          antiCheat: exam.antiCheat,
        };
      });

      return res.json({ success: true, exams: result });
    } catch (err: any) {
      return res.status(500).json({ error: 'Không thể lấy danh sách đề thi: ' + err.message });
    }
  });

  // Alias GET /api/teacher/exams
  app.get('/api/teacher/exams', (req: Request, res: Response) => {
    try {
      const exams = ExamRepository.getExams();
      return res.json({ success: true, exams });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
  });

  // 3. Get Exam Detail
  app.get('/api/exam/detail/:code', (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const exam = ExamRepository.getExamByCode(code);
      if (!exam) {
        return res.status(404).json({ error: 'Mã đề không tồn tại.' });
      }
      return res.json({ success: true, exam });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
  });

  // 4. Update Exam Status / Settings / Questions & Points
  app.put('/api/exam/update/:code', (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const { status, antiCheat, allowExplanations, duration, examPackage, totalPoints, title } = req.body;
      const exam = ExamRepository.getExamByCode(code);
      if (!exam) {
        return res.status(404).json({ error: 'Mã đề không tồn tại.' });
      }

      if (status) exam.status = status;
      if (allowExplanations !== undefined) exam.allowExplanations = !!allowExplanations;
      if (duration) exam.duration = Number(duration);
      if (antiCheat) exam.antiCheat = { ...exam.antiCheat, ...antiCheat };
      if (examPackage) exam.examPackage = examPackage;
      if (totalPoints !== undefined) exam.totalPoints = Number(totalPoints);
      if (title) exam.title = title;

      ExamRepository.saveExam(exam);
      return res.json({ success: true, exam });
    } catch (err: any) {
      return res.status(500).json({ error: 'Không thể cập nhật đề thi: ' + err.message });
    }
  });

  // Alias PUT /api/teacher/exam/update
  app.put('/api/teacher/exam/update', (req: Request, res: Response) => {
    const code = req.body.code;
    if (!code) return res.status(400).json({ error: 'Thiếu mã đề code.' });
    req.params.code = code;
    const exam = ExamRepository.getExamByCode(code);
    if (!exam) return res.status(404).json({ error: 'Mã đề không tồn tại.' });
    if (req.body.status) exam.status = req.body.status;
    ExamRepository.saveExam(exam);
    return res.json({ success: true, exam });
  });

  // 5. Delete Exam
  app.delete('/api/exam/delete/:code', (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const deleted = ExamRepository.deleteExam(code);
      if (!deleted) {
        return res.status(404).json({ error: 'Không tìm thấy đề thi để xóa.' });
      }
      return res.json({ success: true, message: 'Xóa đề thi thành công.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
  });

  // Alias DELETE /api/teacher/exam/delete
  app.delete('/api/teacher/exam/delete', (req: Request, res: Response) => {
    const code = req.body?.code || req.query?.code;
    if (!code) return res.status(400).json({ error: 'Thiếu mã đề.' });
    const deleted = ExamRepository.deleteExam(code as string);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy đề thi.' });
    return res.json({ success: true });
  });

  // 6. Check Student Exam Code (Public)
  app.get('/api/exam/student-info/:code', (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const exam = ExamRepository.getExamByCode(code);

      if (!exam) {
        return res.status(404).json({ error: 'Mã đề không tồn tại.' });
      }

      if (exam.status === 'locked') {
        return res.status(403).json({ error: 'Đề đã kết thúc.' });
      }

      return res.json({
        success: true,
        info: {
          code: exam.code,
          title: exam.title,
          subject: exam.subject,
          grade: exam.grade,
          duration: exam.duration,
          totalPoints: exam.totalPoints,
          antiCheat: exam.antiCheat,
          questionCount: exam.examPackage?.exams?.[0]?.questions?.length || 0,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
  });

  // 7. Student Start / Resume Exam Session
  app.post('/api/exam/start', (req: Request, res: Response) => {
    try {
      const { code, studentName, studentClass, studentSchool, studentId } = req.body;

      if (!code || !studentName || !studentClass) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ Mã đề, Họ tên và Lớp.' });
      }

      const exam = ExamRepository.getExamByCode(code);
      if (!exam) {
        return res.status(404).json({ error: 'Mã đề không tồn tại.' });
      }

      if (exam.status === 'locked') {
        return res.status(403).json({ error: 'Đề thi này hiện đang bị khóa hoặc đã kết thúc.' });
      }

      const normalizeClassStr = (str: string) =>
        str ? str.trim().toLowerCase().replace(/^(lớp|lop|class)\s*/gi, '').replace(/[^a-z0-9]/gi, '') : '';

      const normalizeNameStr = (str: string) =>
        str ? str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ') : '';

      // Validate allowed classes for the exam
      if (exam.allowedClasses && Array.isArray(exam.allowedClasses) && exam.allowedClasses.length > 0) {
        const studentNormClass = normalizeClassStr(studentClass);
        const isAllowed = exam.allowedClasses.some(
          (c) => normalizeClassStr(c) === studentNormClass
        );
        if (!isAllowed) {
          return res.status(400).json({
            error: `Cảnh báo: Tên lớp "${studentClass}" không thuộc danh sách các lớp được phép làm bài thi này (${exam.allowedClasses.join(', ')}). Vui lòng kiểm tra lại thông tin tên và lớp!`,
          });
        }
      }

      // Validate student Name and Class against system database (ClassRepository)
      const allClasses = ClassRepository.getClasses();
      const allStudents = ClassRepository.getStudents();

      const normClass = normalizeClassStr(studentClass);
      const normName = normalizeNameStr(studentName);
      const normSbd = studentId ? studentId.trim().toLowerCase() : '';

      // Validate class existence if system has class or student database
      if (allClasses.length > 0 || allStudents.length > 0) {
        const isClassInSystem =
          allClasses.some((c) => normalizeClassStr(c.name) === normClass || c.id === studentClass) ||
          allStudents.some((s) => normalizeClassStr(s.className) === normClass) ||
          (exam.allowedClasses && exam.allowedClasses.some((c) => normalizeClassStr(c) === normClass));

        if (!isClassInSystem) {
          return res.status(400).json({
            error: `Cảnh báo: Lớp "${studentClass}" không tồn tại trên hệ thống. Vui lòng kiểm tra lại thông tin tên và lớp!`,
          });
        }
      }

      // Validate student existence in student roster if system has registered students
      if (allStudents.length > 0) {
        let matchedStudent = undefined;

        // Check by SBD first if provided
        if (normSbd) {
          matchedStudent = allStudents.find((s) => s.sbd && s.sbd.trim().toLowerCase() === normSbd);
          if (matchedStudent) {
            const studentNormName = normalizeNameStr(matchedStudent.name);
            const studentNormClass = normalizeClassStr(matchedStudent.className);
            if (studentNormName !== normName) {
              return res.status(400).json({
                error: `Cảnh báo: Mã HS/SBD "${studentId}" thuộc về học sinh "${matchedStudent.name}" (Lớp ${matchedStudent.className}), không phải "${studentName}". Vui lòng kiểm tra lại thông tin!`,
              });
            }
            if (studentNormClass !== normClass) {
              return res.status(400).json({
                error: `Cảnh báo: Học sinh "${matchedStudent.name}" thuộc Lớp "${matchedStudent.className}", không phải Lớp "${studentClass}". Vui lòng kiểm tra lại thông tin!`,
              });
            }
          }
        }

        // If not matched by SBD, search by Student Name in all students
        if (!matchedStudent) {
          const matchingNameStudents = allStudents.filter(
            (s) =>
              normalizeNameStr(s.name) === normName ||
              s.name.trim().toLowerCase() === studentName.trim().toLowerCase()
          );

          if (matchingNameStudents.length > 0) {
            // Check if any match belongs to studentClass
            const exactClassMatch = matchingNameStudents.find(
              (s) => normalizeClassStr(s.className) === normClass || s.classId === studentClass
            );
            if (!exactClassMatch) {
              const actualClass = matchingNameStudents[0].className;
              return res.status(400).json({
                error: `Cảnh báo: Học sinh "${studentName}" trên hệ thống thuộc Lớp "${actualClass}", không phải Lớp "${studentClass}". Vui lòng kiểm tra lại thông tin lớp!`,
              });
            }
          } else {
            // Name not found anywhere in allStudents. Check if there are registered students in that class
            const studentsInClass = allStudents.filter(
              (s) => normalizeClassStr(s.className) === normClass || s.classId === studentClass
            );
            if (studentsInClass.length > 0) {
              return res.status(400).json({
                error: `Cảnh báo: Không tìm thấy học sinh "${studentName}" trong danh sách Lớp "${studentClass}" trên hệ thống. Vui lòng kiểm tra lại chính xác Họ và Tên!`,
              });
            } else {
              return res.status(400).json({
                error: `Cảnh báo: Học sinh "${studentName}" (Lớp ${studentClass}) không có trong danh sách học sinh của hệ thống. Vui lòng kiểm tra lại thông tin tên và lớp!`,
              });
            }
          }
        }
      }

      // Check for existing session (F5 / Re-entry / Submitted check)
      let session = ExamRepository.findStudentSession(code, studentName, studentClass, studentId);

      if (session) {
        // If already submitted -> return evaluated result for read-only review
        if (session.status === 'submitted') {
          const evaluatedResult = evaluateStudentSessionResult(session, exam);
          return res.json({
            success: true,
            isAlreadySubmitted: true,
            result: evaluatedResult,
            session,
            examInfo: {
              code: exam.code,
              title: exam.title,
              subject: exam.subject,
              grade: exam.grade,
              duration: exam.duration,
              totalPoints: exam.totalPoints,
              allowExplanations: exam.allowExplanations,
            },
          });
        }

        // Resume in-progress session
        const cleanQuestions = sanitizeQuestionsForStudent(
          session.shuffledQuestions || [],
          exam.allowExplanations
        );

        return res.json({
          success: true,
          isResume: true,
          session: {
            id: session.id,
            examCode: session.examCode,
            studentName: session.studentName,
            studentClass: session.studentClass,
            studentId: session.studentId,
            studentSchool: session.studentSchool,
            startTime: session.startTime,
            remainingSeconds: session.remainingSeconds,
            answers: session.answers || {},
            activityLogs: session.activityLogs || [],
            status: session.status,
          },
          questions: cleanQuestions,
          examInfo: {
            code: exam.code,
            title: exam.title,
            subject: exam.subject,
            grade: exam.grade,
            duration: exam.duration,
            totalPoints: exam.totalPoints,
            antiCheat: exam.antiCheat,
            allowExplanations: exam.allowExplanations,
          },
        });
      }

      // Create new session with unique random seed per student
      const seed =
        exam.code + '_' + (studentId || studentName) + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const shuffled = generateShuffledExamPaper(exam.examPackage, seed, {
        shuffleQuestions: exam.antiCheat?.shuffleQuestions !== false,
        shuffleOptions: exam.antiCheat?.shuffleOptions !== false,
      });

      const newSession: StudentSession = {
        id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        examCode: exam.code,
        studentName: studentName.trim(),
        studentClass: studentClass.trim(),
        studentId: (studentId || '').trim() || undefined,
        studentSchool: (studentSchool || '').trim(),
        seed,
        startTime: new Date().toISOString(),
        remainingSeconds: exam.duration * 60,
        answers: {},
        shuffledQuestions: shuffled.questions,
        originalAnswersMap: shuffled.correctAnswerMap,
        activityLogs: [
          {
            timestamp: new Date().toISOString(),
            event: 'Bắt đầu làm bài',
          },
        ],
        status: 'in_progress',
      };

      ExamRepository.saveSession(newSession);

      const cleanQuestions = sanitizeQuestionsForStudent(shuffled.questions, exam.allowExplanations);

      return res.json({
        success: true,
        isResume: false,
        session: {
          id: newSession.id,
          examCode: newSession.examCode,
          studentName: newSession.studentName,
          studentClass: newSession.studentClass,
          studentId: newSession.studentId,
          studentSchool: newSession.studentSchool,
          startTime: newSession.startTime,
          remainingSeconds: newSession.remainingSeconds,
          answers: {},
          activityLogs: newSession.activityLogs,
          status: newSession.status,
        },
        questions: cleanQuestions,
        examInfo: {
          code: exam.code,
          title: exam.title,
          subject: exam.subject,
          grade: exam.grade,
          duration: exam.duration,
          totalPoints: exam.totalPoints,
          antiCheat: exam.antiCheat,
          allowExplanations: exam.allowExplanations,
        },
      });
    } catch (err: any) {
      console.error('Lỗi khởi tạo làm bài:', err);
      return res.status(500).json({ error: 'Không thể bắt đầu bài thi: ' + err.message });
    }
  });

  // 8. Save Progress
  app.post('/api/exam/save-progress', (req: Request, res: Response) => {
    try {
      const { sessionId, answers, remainingSeconds } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'Thiếu sessionId.' });

      const session = ExamRepository.getSessionById(sessionId);
      if (!session) return res.status(404).json({ error: 'Phiên làm bài không tồn tại.' });

      if (session.status === 'submitted') {
        return res.json({ success: true, message: 'Bài thi đã nộp trước đó.' });
      }

      if (answers) session.answers = answers;
      if (typeof remainingSeconds === 'number') session.remainingSeconds = remainingSeconds;

      ExamRepository.saveSession(session);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi lưu tiến trình: ' + err.message });
    }
  });

  // 9. Submit Exam
  app.post('/api/exam/submit', (req: Request, res: Response) => {
    try {
      const { sessionId, answers, remainingSeconds } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'Thiếu sessionId.' });

      const session = ExamRepository.getSessionById(sessionId);
      if (!session) return res.status(404).json({ error: 'Phiên làm bài không tồn tại.' });

      const exam = ExamRepository.getExamByCode(session.examCode);
      const finalAnswers = answers || session.answers || {};

      session.answers = finalAnswers;
      session.remainingSeconds = remainingSeconds ?? 0;
      session.submitTime = new Date().toISOString();
      session.status = 'submitted';

      const result = evaluateStudentSessionResult(session, exam!);

      session.score = result.score;
      session.correctCount = result.correctCount;
      session.incorrectCount = result.incorrectCount;
      session.totalQuestions = result.totalQuestions;

      session.activityLogs.push({
        timestamp: new Date().toISOString(),
        event: 'Nộp bài',
        details: `Điểm số: ${result.score}/10 - Đúng: ${result.correctCount}/${result.totalQuestions}`,
      });

      ExamRepository.saveSession(session);

      return res.json({
        success: true,
        result,
      });
    } catch (err: any) {
      console.error('Lỗi khi nộp bài:', err);
      return res.status(500).json({ error: 'Không thể nộp bài: ' + err.message });
    }
  });

  // 10. Log Anti-Cheat Activity
  app.post('/api/exam/log-activity', (req: Request, res: Response) => {
    try {
      const { sessionId, event, details } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'Thiếu sessionId.' });

      const session = ExamRepository.getSessionById(sessionId);
      if (!session) return res.status(404).json({ error: 'Phiên làm bài không tồn tại.' });

      if (!Array.isArray(session.activityLogs)) {
        session.activityLogs = [];
      }

      session.activityLogs.push({
        timestamp: new Date().toISOString(),
        event: event || 'Hành vi không xác định',
        details: details || '',
      });

      ExamRepository.saveSession(session);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi ghi nhật ký: ' + err.message });
    }
  });

  // 11. Teacher Get Results
  app.get('/api/teacher/results', (req: Request, res: Response) => {
    try {
      const code = (req.query.code as string) || 'ALL';
      const results = ExamRepository.getResultsByExamCode(code);

      const mapped = results.map((s) => {
        const tabSwitches = (s.activityLogs || []).filter((l) =>
          l.event.toLowerCase().includes('chuyển tab')
        ).length;

        const start = new Date(s.startTime).getTime();
        const end = s.submitTime ? new Date(s.submitTime).getTime() : start;
        const durationMinutes = Math.round((end - start) / 60000);

        return {
          id: s.id,
          examCode: s.examCode,
          studentName: s.studentName,
          studentClass: s.studentClass,
          studentSbd: s.studentId || '',
          studentId: s.studentId || '',
          studentSchool: s.studentSchool || '',
          startTime: s.startTime,
          submitTime: s.submitTime,
          durationMinutes,
          score: s.score ?? 0,
          correctCount: s.correctCount ?? 0,
          incorrectCount: s.incorrectCount ?? 0,
          totalQuestions: s.totalQuestions ?? 0,
          tabSwitches,
          activityLogs: s.activityLogs || [],
        };
      });

      return res.json({ success: true, results: mapped });
    } catch (err: any) {
      return res.status(500).json({ error: 'Không thể lấy kết quả: ' + err.message });
    }
  });

  // 12. Teacher Delete / Reset Student Result
  app.delete('/api/teacher/results/:sessionId', (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const deleted = ExamRepository.deleteSession(sessionId);
      if (!deleted) {
        return res.status(404).json({ error: 'Không tìm thấy kết quả để xóa.' });
      }
      return res.json({ success: true, message: 'Đã xóa kết quả và cho phép học sinh làm lại bài thi.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
  });

  // 13. Teacher Allow Retake / Reset Session by SBD or SessionId
  app.post('/api/exam/reset-student-session', (req: Request, res: Response) => {
    try {
      const { sessionId, examCode, sbd, studentName } = req.body;
      let deleted = false;

      if (sessionId) {
        if (ExamRepository.deleteSession(sessionId)) {
          deleted = true;
        }
      }

      const sessions = ExamRepository.getSessions();
      const normSbd = (sbd || '').trim().toLowerCase();
      const normName = (studentName || '').trim().toLowerCase();
      const normCode = (examCode || '').trim().toUpperCase();

      // Look up student record if SBD provided
      const targetStudent = normSbd ? ClassRepository.findStudentBySbd(normSbd) : undefined;

      const targets = sessions.filter((s) => {
        // Skip if sessionId already handled
        if (sessionId && s.id === sessionId) return true;

        const matchCode = !normCode || s.examCode.toUpperCase() === normCode;
        if (!matchCode) return false;

        // Match by SBD in studentId
        if (normSbd && s.studentId && s.studentId.trim().toLowerCase() === normSbd) {
          return true;
        }

        // Match by SBD in studentName
        if (normSbd && s.studentName.trim().toLowerCase() === normSbd) {
          return true;
        }

        // Match by studentName
        if (normName && s.studentName.trim().toLowerCase() === normName) {
          return true;
        }

        // Match by student found from database SBD
        if (targetStudent) {
          if (
            s.studentName.trim().toLowerCase() === targetStudent.name.trim().toLowerCase() &&
            s.studentClass.trim().toLowerCase() === targetStudent.className.trim().toLowerCase()
          ) {
            return true;
          }
        }

        return false;
      });

      targets.forEach((t) => {
        if (ExamRepository.deleteSession(t.id)) {
          deleted = true;
        }
      });

      if (deleted) {
        return res.json({
          success: true,
          message: 'Đã reset lượt làm bài thành công! Học sinh hiện có thể nhập SBD và làm lại bài thi.',
        });
      } else {
        return res.status(404).json({
          error: 'Không tìm thấy lượt làm bài nào phù hợp để reset cho học sinh này.',
        });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'Lỗi reset lượt làm bài: ' + err.message });
    }
  });
}
