import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  LogOut,
  Send,
  ShieldAlert,
  Sparkles,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { OnlineExamService } from '../services/onlineExamService';
import { MathText } from './MathText';

interface StudentExamViewProps {
  initialCode?: string;
  onExit?: () => void;
}

export const StudentExamView: React.FC<StudentExamViewProps> = ({
  initialCode = '',
  onExit,
}) => {
  // Step: 'login' | 'taking' | 'result' | 'closed'
  const [step, setStep] = useState<'login' | 'taking' | 'result' | 'closed'>('login');

  // Login Form States
  const [examCode, setExamCode] = useState((initialCode || '').trim().toUpperCase());

  useEffect(() => {
    if (initialCode) {
      setExamCode(initialCode.trim().toUpperCase());
    }
  }, [initialCode]);
  const [sbdInput, setSbdInput] = useState('');
  const [sbdVerified, setSbdVerified] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [loginMode, setLoginMode] = useState<'SBD' | 'MANUAL'>('SBD');

  // Exam Public Info (Loaded during login)
  const [examInfo, setExamInfo] = useState<any>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Session States
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Timer Clock
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Anti-cheat States
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showAntiCheatModal, setShowAntiCheatModal] = useState(false);

  // Exit Confirmation Modal State
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Submission / Loading
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  // Result State
  const [examResult, setExamResult] = useState<any>(null);

  // System Classes and Students for validation
  const [systemClasses, setSystemClasses] = useState<any[]>([]);
  const [systemStudents, setSystemStudents] = useState<any[]>([]);

  useEffect(() => {
    OnlineExamService.getClasses(true)
      .then((res) => {
        if (res.success && res.classes) {
          setSystemClasses(res.classes);
        }
      })
      .catch((err) => console.error('Lỗi khi tải danh sách lớp:', err));

    OnlineExamService.getStudents(undefined, true)
      .then((res) => {
        if (res.success && res.students) {
          setSystemStudents(res.students);
        }
      })
      .catch((err) => console.error('Lỗi khi tải danh sách học sinh:', err));
  }, []);

  const normalizeClassStr = (str: string) => {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^(lớp|lop|class|khối|khoi)\s*/gi, '')
      .replace(/[^a-z0-9]/gi, '');
  };

  const normalizeNameStr = (str: string) => {
    if (!str) return '';
    return str
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  // Auto-check Exam Code metadata on typing or initial load
  useEffect(() => {
    if (examCode.trim().length >= 4) {
      checkExamCodeInfo(examCode.trim().toUpperCase());
    } else {
      setExamInfo(null);
      setLoginError('');
    }
  }, [examCode]);

  const checkExamCodeInfo = async (code: string) => {
    setCheckingCode(true);
    setLoginError('');
    try {
      const res = await OnlineExamService.getStudentExamInfo(code);
      if (res.success) {
        setExamInfo(res.info);
      }
    } catch (err: any) {
      setExamInfo(null);
      setLoginError(err.message || 'Mã đề không tồn tại.');
    } finally {
      setCheckingCode(false);
    }
  };

  // Tra cứu SBD
  const handleLookupSbd = async (sbdToLookup?: string) => {
    const sbd = (sbdToLookup || sbdInput).trim();
    if (!sbd) {
      setLoginError('Vui lòng nhập Số báo danh.');
      return;
    }

    setCheckingCode(true);
    setLoginError('');
    try {
      const res = await OnlineExamService.lookupStudentBySbd(sbd, examCode.trim());
      if (res.success && res.student) {
        setStudentName(res.student.name);
        setStudentClass(res.student.className);
        setStudentId(res.student.sbd);
        if (res.student.school) setStudentSchool(res.student.school);
        setSbdVerified(true);
        setLoginError('');
      }
    } catch (err: any) {
      setSbdVerified(false);
      setLoginError(err.message || `Không tìm thấy thông tin cho SBD: ${sbd}`);
    } finally {
      setCheckingCode(false);
    }
  };

  // Start or Resume Exam
  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingCode(true);
    setLoginError('');

    let curName = studentName.trim();
    let curClass = studentClass.trim();
    let curId = studentId.trim();
    let curSchool = studentSchool.trim();

    // Auto lookup if loginMode is SBD and info not filled yet
    if (loginMode === 'SBD') {
      const targetSbd = (sbdInput || curId).trim();
      if (!targetSbd) {
        setLoginError('Vui lòng nhập Số báo danh.');
        setCheckingCode(false);
        return;
      }
      try {
        const lookup = await OnlineExamService.lookupStudentBySbd(targetSbd, examCode.trim());
        if (lookup.success && lookup.student) {
          curName = lookup.student.name;
          curClass = lookup.student.className;
          curId = lookup.student.sbd;
          if (lookup.student.school) curSchool = lookup.student.school;
          setStudentName(curName);
          setStudentClass(curClass);
          setStudentId(curId);
          setStudentSchool(curSchool);
          setSbdVerified(true);
        } else {
          setLoginError(`Không tìm thấy thông tin cho SBD: ${targetSbd}`);
          setCheckingCode(false);
          return;
        }
      } catch (err: any) {
        setLoginError(err.message || `Số báo danh ${targetSbd} không thuộc lớp được dự thi.`);
        setCheckingCode(false);
        return;
      }
    }

    if (!examCode.trim() || !curName || !curClass) {
      setLoginError('Vui lòng điền đầy đủ Mã đề, Họ tên và Lớp.');
      setCheckingCode(false);
      return;
    }

    // Client-side validation for Allowed Classes
    if (examInfo && examInfo.allowedClasses && Array.isArray(examInfo.allowedClasses) && examInfo.allowedClasses.length > 0) {
      const studentNorm = normalizeClassStr(curClass);
      const isAllowed = examInfo.allowedClasses.some((c: string) => {
        const cNorm = normalizeClassStr(c);
        return (
          cNorm === studentNorm ||
          (cNorm && studentNorm && (studentNorm.startsWith(cNorm) || cNorm.startsWith(studentNorm)))
        );
      });
      if (!isAllowed) {
        setLoginError(
          `Cảnh báo: Tên lớp "${curClass}" không thuộc danh sách các lớp được tham gia bài thi này (${examInfo.allowedClasses.join(', ')}). Vui lòng kiểm tra lại thông tin tên và lớp!`
        );
        setCheckingCode(false);
        return;
      }
    }

    const studentNormClass = normalizeClassStr(curClass);
    const studentNormName = normalizeNameStr(curName);

    // Client-side validation for System Classes
    if (systemClasses.length > 0 || systemStudents.length > 0) {
      const isClassValid =
        systemClasses.some((c) => normalizeClassStr(c.name) === studentNormClass || c.id === curClass) ||
        systemStudents.some((s) => normalizeClassStr(s.className) === studentNormClass) ||
        (examInfo?.allowedClasses && examInfo.allowedClasses.some((c: string) => normalizeClassStr(c) === studentNormClass));

      if (!isClassValid) {
        setLoginError(`Cảnh báo: Lớp "${curClass}" không tồn tại trên hệ thống. Vui lòng kiểm tra lại thông tin Lớp!`);
        setCheckingCode(false);
        return;
      }
    }

    // Client-side validation for System Students
    if (systemStudents.length > 0) {
      const matchingNameStudents = systemStudents.filter(
        (s) => normalizeNameStr(s.name) === studentNormName || s.name.trim().toLowerCase() === curName.trim().toLowerCase()
      );

      if (matchingNameStudents.length > 0) {
        const exactMatch = matchingNameStudents.find(
          (s) => normalizeClassStr(s.className) === studentNormClass || s.classId === curClass
        );
        if (!exactMatch) {
          const actualClass = matchingNameStudents[0].className;
          setLoginError(`Cảnh báo: Học sinh "${curName}" được ghi nhận thuộc Lớp "${actualClass}", không phải Lớp "${curClass}". Vui lòng kiểm tra lại thông tin Lớp!`);
          setCheckingCode(false);
          return;
        }
      } else {
        const studentsInClass = systemStudents.filter(
          (s) => normalizeClassStr(s.className) === studentNormClass || s.classId === curClass
        );
        if (studentsInClass.length > 0) {
          setLoginError(`Cảnh báo: Không tìm thấy học sinh "${curName}" trong danh sách Lớp "${curClass}" trên hệ thống. Vui lòng kiểm tra lại chính xác Họ và Tên!`);
          setCheckingCode(false);
          return;
        } else {
          setLoginError(`Cảnh báo: Học sinh "${curName}" (Lớp ${curClass}) không có trong danh sách học sinh của hệ thống. Vui lòng kiểm tra lại thông tin tên và lớp!`);
          setCheckingCode(false);
          return;
        }
      }
    }

    try {
      const res = await OnlineExamService.startStudentExam({
        code: examCode.trim().toUpperCase(),
        studentName: curName,
        studentClass: curClass,
        studentId: curId,
        studentSchool: curSchool,
      });

      if (res.isAlreadySubmitted) {
        setExamResult(res.result);
        if (res.examInfo) setExamInfo(res.examInfo);
        if (res.session) setSession(res.session);
        setStep('result');
        return;
      }

      setSession(res.session);
      setQuestions(res.questions || []);
      setAnswers(res.session?.answers || {});
      setRemainingSeconds(res.session?.remainingSeconds || (res.examInfo?.duration || 45) * 60);
      setExamInfo(res.examInfo);

      // Transition to Taking Exam
      setStep('taking');
    } catch (err: any) {
      setLoginError(err.message || 'Không thể vào thi.');
    } finally {
      setCheckingCode(false);
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (step === 'taking' && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Auto submit on timer end
            handleFinalSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, remainingSeconds]);

  // Periodic Auto-Save Progress (every 15 seconds)
  useEffect(() => {
    if (step !== 'taking' || !session?.id) return;
    const saveInterval = setInterval(() => {
      OnlineExamService.saveProgress(session.id, answers, remainingSeconds);
    }, 15000);

    return () => clearInterval(saveInterval);
  }, [step, session, answers, remainingSeconds]);

  // Anti-Cheat Tab Switching Detector
  useEffect(() => {
    if (step !== 'taking' || !examInfo?.antiCheat?.warnTabSwitch) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);
        setShowAntiCheatModal(true);

        if (session?.id) {
          OnlineExamService.logActivity(
            session.id,
            `Cảnh báo: Chuyển tab lần thứ ${newCount}`,
            `Thời điểm: ${new Date().toLocaleTimeString('vi-VN')}`
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [step, tabSwitches, examInfo, session]);

  // Handle Option / Answer Select
  const handleAnswerSelect = (questionId: string, answerValue: any) => {
    const updatedAnswers = { ...answers, [questionId]: answerValue };
    setAnswers(updatedAnswers);

    // Save progress immediately
    if (session?.id) {
      OnlineExamService.saveProgress(session.id, updatedAnswers, remainingSeconds);
    }
  };

  // Submit Exam
  const handleFinalSubmit = async (isAutoTimeout = false) => {
    if (submitting) return;
    setSubmitting(true);
    setShowSubmitConfirmModal(false);

    try {
      const res = await OnlineExamService.submitExam(session.id, answers, remainingSeconds);
      if (res.success) {
        setExamResult(res.result);
        setStep('result');
      }
    } catch (err: any) {
      alert('Lỗi khi nộp bài: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formatting mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Exit Confirmation Modal Component
  const renderExitConfirmModal = () => {
    if (!showExitConfirmModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-950/80 text-rose-400 border border-rose-800/50 rounded-2xl flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-white">Xác nhận thoát khỏi bài thi?</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {step === 'taking'
              ? 'Bài thi của bạn đang diễn ra. Nếu thoát bây giờ, phiên làm bài sẽ kết thúc và không thể tiếp tục.'
              : 'Bạn có chắc chắn muốn thoát khỏi trang làm bài thi trực tuyến không?'}
          </p>
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowExitConfirmModal(false)}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Ở lại
            </button>
            <button
              type="button"
              onClick={() => {
                setShowExitConfirmModal(false);
                try {
                  window.close();
                } catch (e) {}
                setStep('closed');
              }}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              Thoát Ngay
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // STEP 1: LOGIN FORM
  // -------------------------------------------------------------
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative">
          <button
            type="button"
            onClick={() => setShowExitConfirmModal(true)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
            title="Thoát khỏi bài thi"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-teal-500/20 border border-teal-400/30 text-teal-300 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Học Sinh Làm Bài Trực Tuyến</h1>
            <p className="text-xs text-slate-400">
              Nhập mã đề thi do giáo viên cung cấp và điền thông tin cá nhân để bắt đầu
            </p>
          </div>

          {loginError && (
            <div className="p-4 bg-rose-950/90 border-2 border-rose-600/80 text-rose-100 rounded-2xl text-xs space-y-1.5 shadow-xl animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center space-x-2 font-black text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 animate-bounce" />
                <span>CẢNH BÁO KIỂM TRA LẠI THÔNG TIN</span>
              </div>
              <p className="text-rose-100 font-medium leading-relaxed">
                {loginError}
              </p>
              <p className="text-[11px] text-rose-300/90 font-semibold border-t border-rose-800/60 pt-1.5 mt-1">
                💡 Gợi ý: Vui lòng kiểm tra chính xác Tên lớp (ví dụ: 10A1, 10A2) và Họ tên của bạn trước khi thử lại!
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleStartExam} className="space-y-4 text-xs">
            {/* Exam Code Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Mã Đề Thi (*)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="VD: A7X92Q"
                  maxLength={10}
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 font-mono font-black text-lg tracking-widest text-teal-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden uppercase"
                />
                {checkingCode && (
                  <Loader2 className="w-5 h-5 text-teal-400 animate-spin absolute right-3.5 top-3.5" />
                )}
              </div>
            </div>

            {/* Exam Live Info Box */}
            {examInfo && (
              <div className="p-3.5 bg-teal-950/50 border border-teal-700/60 rounded-2xl space-y-1 text-teal-200 animate-in fade-in">
                <div className="font-bold text-sm text-teal-100">{examInfo.title}</div>
                <div className="flex items-center space-x-3 text-[11px] text-teal-300 font-medium">
                  <span>Môn: {examInfo.subject}</span>
                  <span>•</span>
                  <span>Khối: {examInfo.grade}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{examInfo.duration} phút</span>
                  </span>
                </div>
              </div>
            )}

            {/* Login Mode Toggle: SBD vs Manual */}
            <div className="flex items-center justify-between p-1 bg-slate-900 rounded-2xl border border-slate-700">
              <button
                type="button"
                onClick={() => setLoginMode('SBD')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  loginMode === 'SBD'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đăng nhập bằng SBD
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('MANUAL')}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
                  loginMode === 'MANUAL'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nhập Tên & Lớp
              </button>
            </div>

            {loginMode === 'SBD' ? (
              <div className="space-y-3.5">
                {/* SBD Lookup Input */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Số Báo Danh (SBD) (*)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="VD: 10A101"
                      value={sbdInput}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setSbdInput(val);
                        if (val.length >= 4) {
                          handleLookupSbd(val);
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 font-mono font-black text-base tracking-wider text-teal-300 focus:ring-2 focus:ring-teal-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupSbd()}
                      className="px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shrink-0"
                    >
                      Xác Nhận
                    </button>
                  </div>
                </div>

                {/* Verified Student Info Card */}
                {sbdVerified && studentName ? (
                  <div className="p-4 bg-teal-950/70 border border-teal-500/60 rounded-2xl space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-teal-300 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>ĐÃ XÁC THỰC HỌC SINH</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Họ và Tên:</span>
                        <span className="font-black text-white text-sm">{studentName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Lớp:</span>
                        <span className="font-black text-teal-200 text-sm">Lớp {studentClass}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    * Nhập Số báo danh (VD: 10A101) để tự động lấy tên và lớp của bạn.
                  </p>
                )}
              </div>
            ) : (
              /* Manual Input Fallback */
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Họ Và Tên Học Sinh (*)</span>
                    {studentClass && systemStudents.some((s) => normalizeClassStr(s.className) === normalizeClassStr(studentClass)) && (
                      <span className="text-[10px] text-teal-400 font-semibold">
                        Gợi ý theo Lớp {studentClass}
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    list="system-students-name-list"
                    required={loginMode === 'MANUAL'}
                    placeholder="VD: Nguyễn Văn An"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    className={`w-full bg-slate-900 border rounded-2xl px-4 py-3 font-semibold text-slate-100 focus:ring-2 focus:outline-hidden transition-all ${
                      loginError && (loginError.includes('Họ') || loginError.includes('tên') || loginError.includes('học sinh') || loginError.includes('Học sinh'))
                        ? 'border-rose-500 focus:ring-rose-500 bg-rose-950/20'
                        : 'border-slate-700 focus:ring-teal-500'
                    }`}
                  />
                  <datalist id="system-students-name-list">
                    {systemStudents
                      .filter((s) =>
                        studentClass
                          ? normalizeClassStr(s.className) === normalizeClassStr(studentClass) || s.classId === studentClass
                          : true
                      )
                      .map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.className} {s.sbd ? `- SBD: ${s.sbd}` : ''}
                        </option>
                      ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                      <span>Lớp (*)</span>
                      {examInfo?.allowedClasses && examInfo.allowedClasses.length > 0 && (
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Lớp cho phép: {examInfo.allowedClasses.join(', ')}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      list="exam-allowed-classes-list"
                      required={loginMode === 'MANUAL'}
                      placeholder="VD: 10A1"
                      value={studentClass}
                      onChange={(e) => {
                        setStudentClass(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      className={`w-full bg-slate-900 border rounded-2xl px-4 py-3 font-semibold text-slate-100 focus:ring-2 focus:outline-hidden transition-all ${
                        loginError && (loginError.includes('lớp') || loginError.includes('Lớp'))
                          ? 'border-rose-500 focus:ring-rose-500 bg-rose-950/20'
                          : 'border-slate-700 focus:ring-teal-500'
                      }`}
                    />
                    <datalist id="exam-allowed-classes-list">
                      {examInfo?.allowedClasses && examInfo.allowedClasses.length > 0
                        ? examInfo.allowedClasses.map((cls: string) => (
                            <option key={cls} value={cls} />
                          ))
                        : Array.from(
                            new Set([
                              ...systemClasses.map((c) => c.name),
                              ...systemStudents.map((s) => s.className),
                            ])
                          ).map((clsName) => <option key={clsName} value={clsName} />)}
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      SBD / Mã HS
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 10A101"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 font-semibold text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={checkingCode}
              className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-teal-950 font-black rounded-2xl text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 mt-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Bắt Đầu Làm Bài</span>
            </button>
          </form>
        </div>
        {renderExitConfirmModal()}
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: TAKING EXAM
  // -------------------------------------------------------------
  if (step === 'taking') {
    const currentQ = questions[currentQuestionIdx];
    const isLastQuestion = currentQuestionIdx === questions.length - 1;
    const isFirstQuestion = currentQuestionIdx === 0;

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
        {/* Sticky Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-teal-500 text-slate-950 font-black rounded-xl flex items-center justify-center text-sm shrink-0">
            {examInfo?.code}
          </div>
          <div className="hidden sm:block">
            <h2 className="text-xs font-bold truncate max-w-xs">{examInfo?.title}</h2>
            <p className="text-[10px] text-teal-300">
              {studentName} - Lớp {studentClass}
            </p>
          </div>
        </div>

        {/* Digital Countdown Timer Clock */}
        <div className="flex items-center space-x-3">
          <div
            className={`px-4 py-2 rounded-2xl border font-mono font-black text-sm flex items-center space-x-2 transition-colors ${
              remainingSeconds <= 300
                ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                : 'bg-slate-800 text-amber-300 border-slate-700'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitConfirmModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Nộp Bài</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExitConfirmModal(true)}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="Thoát khỏi bài thi"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Main Question Display Card */}
        <div className="lg:col-span-3 space-y-4">
          {currentQ && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-xl">
                  Câu {currentQ.number} / {questions.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentQ.partType === 'PART1'
                    ? 'Trắc nghiệm 4 lựa chọn'
                    : currentQ.partType === 'PART2'
                    ? 'Trắc nghiệm Đúng/Sai'
                    : currentQ.partType === 'PART3'
                    ? 'Trả lời ngắn'
                    : 'Tự luận'}
                  {' ('}
                  {currentQ.points} điểm{')'}
                </span>
              </div>

              {/* Question Content */}
              <div className="text-sm md:text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100 space-y-3">
                <MathText content={currentQ.content || currentQ.questionText || ''} />
              </div>

              {/* Answer Choices */}

              {/* Part 1: MCQ 4 Options */}
              {(currentQ.partType === 'PART1' || !currentQ.partType) && (
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {currentQ.options?.map((opt: any) => {
                    const isSelected = answers[currentQ.id] === opt.key;
                    const optText = typeof opt === 'string' ? opt : (opt.content || opt.text || '');
                    return (
                      <button
                        key={opt.key || optText}
                        onClick={() => handleAnswerSelect(currentQ.id, opt.key)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start space-x-3.5 ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-100 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {opt.key}
                        </div>
                        <div className="text-sm pt-0.5">
                          <MathText content={optText} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Part 2: True/False Grid */}
              {currentQ.partType === 'PART2' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-500">
                    Chọn Đúng hoặc Sai cho mỗi ý dưới đây:
                  </p>
                  <div className="space-y-2.5">
                    {currentQ.trueFalseStatements?.map((st: any) => {
                      const currentTfState = answers[currentQ.id] || {};
                      const selectedVal = currentTfState[st.key];
                      const stText = typeof st === 'string' ? st : (st.content || st.text || '');

                      return (
                        <div
                          key={st.key || stText}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            <span className="font-bold text-teal-600 dark:text-teal-400 mr-2">
                              {st.key})
                            </span>
                            <MathText content={stText} />
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => {
                                const newMap = { ...currentTfState, [st.key]: true };
                                handleAnswerSelect(currentQ.id, newMap);
                              }}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                selectedVal === true
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Đúng
                            </button>

                            <button
                              onClick={() => {
                                const newMap = { ...currentTfState, [st.key]: false };
                                handleAnswerSelect(currentQ.id, newMap);
                              }}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                selectedVal === false
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Part 3: Short Answer Input */}
              {currentQ.partType === 'PART3' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Điền kết quả trả lời ngắn của bạn:
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập con số hoặc đáp án ngắn gọn..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Part 4: Essay Textarea */}
              {currentQ.partType === 'PART4' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Trình bày lời giải tự luận chi tiết:
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Viết các bước giải chi tiết tại đây..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  disabled={isFirstQuestion || examInfo?.antiCheat?.disallowPrevious}
                  onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors disabled:opacity-30"
                >
                  ← Câu Trước
                </button>

                <button
                  onClick={() => {
                    if (isLastQuestion) {
                      setShowSubmitConfirmModal(true);
                    } else {
                      setCurrentQuestionIdx((prev) => Math.min(questions.length - 1, prev + 1));
                    }
                  }}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {isLastQuestion ? 'Xem lại & Nộp bài' : 'Câu Tiếp Theo →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Question Navigator Palette */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Danh Sách Câu Hỏi ({questions.length})
            </h3>

            {/* Grid Palette */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIdx;
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';

                return (
                  <button
                    key={q.id}
                    disabled={examInfo?.antiCheat?.disallowPrevious && idx < currentQuestionIdx}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`h-10 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'ring-2 ring-teal-500 bg-teal-600 text-white shadow-md'
                        : isAnswered
                        ? 'bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {q.number}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-md bg-teal-600 inline-block"></span>
                <span>Đang chọn</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-md bg-teal-100 dark:bg-teal-950 border border-teal-400 inline-block"></span>
                <span>Đã trả lời ({Object.keys(answers).length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-800 inline-block"></span>
                <span>Chưa trả lời</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-Cheat Tab Switch Warning Modal */}
      {showAntiCheatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-800/80 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-950 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-lg text-white">CẢNH BÁO VI PHẠM THI</h3>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              Bạn vừa rời khỏi màn hình bài thi ({tabSwitches} lần)! Hành vi này đã được ghi lại trong nhật ký chống gian lận.
            </p>
            <button
              onClick={() => setShowAntiCheatModal(false)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition-colors"
            >
              Tôi Đã Hiểu - Quay Lai Bài Thi
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Xác nhận nộp bài thi?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bạn đã hoàn thành <span className="font-bold text-teal-600">{Object.keys(answers).length}</span>/
              {questions.length} câu hỏi.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold"
              >
                Tiếp tục làm
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-md"
              >
                {submitting ? 'Đang nộp...' : 'Nộp Bài Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renderExitConfirmModal()}
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 4: CLOSED VIEW
  // -------------------------------------------------------------
  if (step === 'closed') {
    return (
      <div className="min-h-screen visionos-bg-dark text-slate-100 flex items-center justify-center p-6">
        <div className="glass-panel max-w-lg w-full p-8 md:p-10 rounded-3xl text-center space-y-6 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 bg-emerald-500/15 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
              Đã Hoàn Thành Bài Thi!
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Cảm ơn bạn đã thực hiện bài kiểm tra. Kết quả bài làm đã được lưu trữ an toàn và nộp thành công lên hệ thống của Giáo viên.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-medium space-y-1">
            <p className="text-emerald-400 font-bold">✓ Phiên làm bài đã kết thúc an toàn</p>
            <p>Bạn có thể đóng thẻ trình duyệt này bất kỳ lúc nào.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                try {
                  window.close();
                } catch (e) {}
              }}
              className="w-full btn-glow-emerald py-3.5 text-white font-black rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Đóng Thẻ Trình Duyệt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 3: RESULT VIEW
  // -------------------------------------------------------------
  if (step === 'result') {
    if (!examResult) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-slate-800 p-6 rounded-3xl text-center space-y-4 border border-slate-700">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold">Bài Thi Đã Được Nộp Thành Công!</h2>
            <p className="text-xs text-slate-400">Cảm ơn bạn đã hoàn thành bài thi.</p>
            <button
              onClick={() => {
                try {
                  window.close();
                } catch (e) {}
                setStep('closed');
              }}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Thoát Bài Thi
            </button>
          </div>
        </div>
      );
    }

    const formatAnswerVal = (val: any) => {
      if (val === null || val === undefined) return 'Chưa trả lời';
      if (typeof val === 'object') {
        const entries = Object.entries(val).filter(([_, v]) => v !== undefined && v !== null && v !== '');
        if (entries.length === 0) return 'Chưa trả lời';
        return entries
          .map(([k, v]) => `${k.toUpperCase()}: ${v ? 'Đúng' : 'Sai'}`)
          .join(' | ');
      }
      return String(val);
    };

    const isQuestionAnswered = (studentAns: any) => {
      if (studentAns === null || studentAns === undefined) return false;
      if (typeof studentAns === 'string') {
        const trimmed = studentAns.trim();
        return trimmed !== '' && trimmed !== 'Chưa trả lời';
      }
      if (typeof studentAns === 'number' || typeof studentAns === 'boolean') {
        return true;
      }
      if (typeof studentAns === 'object') {
        const keys = Object.keys(studentAns);
        if (keys.length === 0) return false;
        return keys.some(
          (k) =>
            studentAns[k] !== undefined &&
            studentAns[k] !== null &&
            studentAns[k] !== ''
        );
      }
      return false;
    };

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex items-center justify-center relative">
        <div className="max-w-2xl w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative">
          <button
            type="button"
            onClick={() => setShowExitConfirmModal(true)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
            title="Thoát khỏi bài thi"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Read-Only Notice Banner if student re-entered after submit */}
          <div className="p-3.5 bg-amber-950/80 border border-amber-600/60 rounded-2xl text-xs text-amber-200 flex items-center space-x-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-extrabold text-amber-300">Bài Thi Đã Được Nộp Trước Đó (Chế Độ Xem Lại)</div>
              <div className="text-[11px] text-amber-200/80">
                Mỗi học sinh chỉ được làm bài 1 lần duy nhất. Bạn có thể xem lại điểm số và đáp án chi tiết bên dưới.
              </div>
            </div>
          </div>

          {/* Top Gauge Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Kết Quả Bài Thi Trực Tuyến</h2>
            <p className="text-xs text-slate-400">
              {studentName || session?.studentName} - Lớp {studentClass || session?.studentClass} {studentId || session?.studentId ? `(SBD: ${studentId || session?.studentId})` : ''} | Mã đề: {examInfo?.code || session?.examCode}
            </p>
          </div>

          {/* Big Score Card */}
          <div className="bg-gradient-to-br from-teal-900/60 to-slate-900 p-6 rounded-3xl border border-teal-700/50 text-center space-y-2">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-widest">
              ĐIỂM SỐ ĐẠT ĐƯỢC
            </span>
            <div className="text-5xl font-black text-teal-300 tracking-tight">
              {Number(examResult.score).toFixed(2)} <span className="text-xl text-teal-400 font-normal">/ 10</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Số câu đúng</span>
              <div className="text-lg font-black text-emerald-400 mt-1">
                {examResult.correctCount} câu
              </div>
            </div>
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Số câu sai</span>
              <div className="text-lg font-black text-rose-400 mt-1">
                {examResult.incorrectCount} câu
              </div>
            </div>
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700 sm:col-span-1 col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Thời Gian Nộp</span>
              <div className="text-xs font-bold text-slate-200 mt-1">
                {examResult.submitTime ? new Date(examResult.submitTime).toLocaleTimeString('vi-VN') : '—'}
              </div>
            </div>
          </div>

          {/* Detailed Review Section */}
          {examResult.detailedGrading && Array.isArray(examResult.detailedGrading) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-teal-300 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Chi Tiết Đáp Án Bài Làm & Lời Giải (Chỉ xem, không chỉnh sửa):</span>
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {examResult.detailedGrading.length} câu hỏi
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-3 p-3 bg-slate-900/80 rounded-2xl border border-slate-700 text-xs shadow-inner">
                {examResult.detailedGrading.map((item: any, i: number) => {
                  const answered = isQuestionAnswered(item.studentAnswer);

                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                        !answered
                          ? 'bg-slate-900/60 border-slate-700/80'
                          : item.isCorrect
                          ? 'bg-emerald-950/20 border-emerald-800/50'
                          : 'bg-rose-950/20 border-rose-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-teal-300 font-extrabold text-sm">
                          Câu {item.questionNumber}:
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                            !answered
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : item.isCorrect
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {!answered
                            ? '— Chưa trả lời'
                            : item.isCorrect
                            ? '✓ Đúng'
                            : '✗ Chưa chính xác'}{' '}
                          ({item.points}/{item.maxPoints}đ)
                        </span>
                      </div>

                      <div className="text-slate-200 font-medium text-xs leading-relaxed">
                        <MathText content={item.content || item.questionContent || ''} />
                      </div>

                      <div className="pt-2 text-[11px] space-y-1.5 bg-slate-900/90 p-3 rounded-xl border border-slate-700/80">
                        <div className="flex items-baseline gap-2">
                          <span className="text-slate-400 font-medium shrink-0">Đã chọn:</span>
                          <div
                            className={`font-bold ${
                              !answered
                                ? 'text-slate-400 italic'
                                : item.isCorrect
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            <MathText content={formatAnswerVal(item.studentAnswer)} />
                          </div>
                        </div>

                        {answered ? (
                          <>
                            <div className="flex items-baseline gap-2">
                              <span className="text-slate-400 font-medium shrink-0">Đáp án chuẩn:</span>
                              <div className="font-extrabold text-emerald-400">
                                <MathText content={formatAnswerVal(item.correctAnswer)} />
                              </div>
                            </div>
                            {item.explanation && (
                              <div className="pt-2 text-teal-300 border-t border-slate-800 space-y-1 mt-2">
                                <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider">
                                  Lời giải chi tiết:
                                </span>
                                <div className="text-slate-200 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                  <MathText content={item.explanation} />
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-amber-400/90 italic text-[11px] pt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 inline-block"></span>
                            <span>Không hiển thị đáp án chuẩn và lời giải cho câu hỏi chưa trả lời.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exit Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                try {
                  window.close();
                } catch (e) {}
                setStep('closed');
              }}
              className="w-full btn-glow-emerald py-4 text-white font-black rounded-2xl text-sm transition-all cursor-pointer shadow-xl flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>Hoàn Thành & Thoát Bài Thi</span>
            </button>
          </div>
        </div>
        {renderExitConfirmModal()}
      </div>
    );
  }

  return null;
};
