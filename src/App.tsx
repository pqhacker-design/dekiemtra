import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { Sidebar, TabType } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TestGeneratorView } from './components/TestGeneratorView';
import { MatrixView } from './components/MatrixView';
import { SpecificationView } from './components/SpecificationView';
import { ExamPaperView } from './components/ExamPaperView';
import { AnswerKeyView } from './components/AnswerKeyView';
import { MultiCodeView } from './components/MultiCodeView';
import { QuestionBankView } from './components/QuestionBankView';
import { SettingsView } from './components/SettingsView';
import { OnlineExamBankView } from './components/OnlineExamBankView';
import { StudentResultsView } from './components/StudentResultsView';
import { StudentExamView } from './components/StudentExamView';
import { ClassManagementView } from './components/ClassManagementView';
import { PublishOnlineModal } from './components/PublishOnlineModal';
import { ShareExamModal } from './components/ShareExamModal';
import { ApiKeyInputModal, QuotaExceededModal, NotificationModal } from './components/ApiModals';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth } from './auth/useAuth';
import { UserManagement } from './pages/UserManagement';

import { AppSettings, ExamMetadata, ExamPackage, MatrixRow, Question, QuestionBankItem, SpecRow } from './types';
import { StorageEngine } from './services/storageEngine';
import { UserDataSync } from './services/userDataSync';
import { GeminiService } from './services/geminiService';
import { ExportDocx } from './services/exportDocx';
import { ExportExcel } from './services/exportExcel';
import { ExportPdf } from './services/exportPdf';
import { OnlineExamService } from './services/onlineExamService';

export default function App() {
  const { user, role, isAdmin } = useAuth();
  const currentUserId = user?.id || user?.username || null;

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Enforce Route Guard: If User role tries to access admin-only tabs (user_management), redirect to dashboard
  useEffect(() => {
    if (role === 'user' && activeTab === 'user_management') {
      setActiveTab('dashboard');
    }
  }, [activeTab, role]);

  // Core Data States
  const [settings, setSettings] = useState<AppSettings>(StorageEngine.getSettings());
  const [examHistory, setExamHistory] = useState<ExamPackage[]>(StorageEngine.getExamHistory());
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(StorageEngine.getQuestionBank());
  const [currentExamPackage, setCurrentExamPackage] = useState<ExamPackage | null>(
    examHistory[0] || null
  );

  // Synchronize user data upon account change / login
  useEffect(() => {
    if (currentUserId) {
      StorageEngine.setCurrentUserId(currentUserId);

      // 1. Instantly load local user cache
      const localSettings = StorageEngine.getSettings();
      setSettings(localSettings);
      const localHist = StorageEngine.getExamHistory();
      setExamHistory(localHist);
      const localBank = StorageEngine.getQuestionBank();
      setQuestionBank(localBank);
      if (localHist.length > 0) setCurrentExamPackage(localHist[0]);

      // 2. Fetch remote user data from Firestore for cross-device sync
      UserDataSync.loadUserData(currentUserId).then((data) => {
        setSettings(data.settings);
        setExamHistory(data.examHistory);
        setQuestionBank(data.questionBank);
        if (data.examHistory && data.examHistory.length > 0) {
          setCurrentExamPackage(data.examHistory[0]);
        } else {
          setCurrentExamPackage(null);
        }
      });

      // 3. Listen to real-time updates from Firestore for this user
      const unsubscribe = UserDataSync.subscribeUserData(currentUserId, (data) => {
        setSettings(data.settings);
        setExamHistory(data.examHistory);
        setQuestionBank(data.questionBank);
      });

      return () => {
        unsubscribe();
      };
    } else {
      StorageEngine.setCurrentUserId(null);
    }
  }, [currentUserId]);

  // Online Exam System States
  const [studentInitialCode, setStudentInitialCode] = useState<string>('');
  const [resultsSelectedCode, setResultsSelectedCode] = useState<string>('ALL');

  // Publish / Share Modals
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [shareModalState, setShareModalState] = useState<{ isOpen: boolean; code: string; title: string }>({
    isOpen: false,
    code: '',
    title: '',
  });

  // URL Query Param Check on Mount (e.g., ?exam=A7X92Q or ?code=A7X92Q)
  useEffect(() => {
    const parseExamCodeFromUrl = () => {
      // 1. Search searchParams
      const searchParams = new URLSearchParams(window.location.search);
      let code = searchParams.get('exam') || searchParams.get('code');

      // 2. Search hash query parameters
      if (!code && window.location.hash) {
        const hashQueryIndex = window.location.hash.indexOf('?');
        if (hashQueryIndex !== -1) {
          const hashParams = new URLSearchParams(window.location.hash.substring(hashQueryIndex));
          code = hashParams.get('exam') || hashParams.get('code');
        }
      }

      // 3. Regex search on full href
      if (!code) {
        const match = window.location.href.match(/[?&](exam|code)=([a-zA-Z0-9_-]+)/i);
        if (match && match[2]) {
          code = match[2];
        }
      }

      if (code) {
        const cleanCode = code.trim().toUpperCase();
        setStudentInitialCode(cleanCode);
        setActiveTab('student_exam');
      }
    };

    parseExamCodeFromUrl();
  }, []);

  // Generation status & Modals
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [notificationModal, setNotificationModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [pendingMetadata, setPendingMetadata] = useState<ExamMetadata | null>(null);

  // Handle dark mode toggle on root html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Save Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageEngine.saveSettings(newSettings);
  };

  // Clear all data
  const handleClearAllData = () => {
    StorageEngine.clearAllData();
    setExamHistory([]);
    setQuestionBank([]);
    setCurrentExamPackage(null);
  };

  // Generate Exam Handler
  const handleGenerateExam = async (metadata: ExamMetadata) => {
    setIsGenerating(true);
    setProgressMessage('Đang khởi tạo prompt và gọi Gemini AI...');

    try {
      const generatedPackage = await GeminiService.generateExamPackage(
        metadata,
        (msg) => setProgressMessage(msg)
      );

      // Save to History
      StorageEngine.saveExamPackage(generatedPackage);
      setExamHistory(StorageEngine.getExamHistory());
      setCurrentExamPackage(generatedPackage);

      // Save new questions to bank
      if (generatedPackage.exams[0]?.questions) {
        const newQBItems: QuestionBankItem[] = generatedPackage.exams[0].questions.map((q) => ({
          ...q,
          id: 'qb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          subject: metadata.subject,
          grade: metadata.grade,
          chapter: metadata.chapterTitle,
          curriculum: metadata.curriculum,
          createdDate: new Date().toISOString(),
        }));
        StorageEngine.saveToQuestionBank(newQBItems);
        setQuestionBank(StorageEngine.getQuestionBank());
      }

      // Automatically publish to Online Exam Bank
      try {
        const pubRes = await OnlineExamService.saveExam({
          title: metadata.examTitle || 'Đề kiểm tra AI CV 7991',
          subject: metadata.subject,
          grade: metadata.grade,
          duration: metadata.durationMinutes || 45,
          totalPoints: 10.0,
          topic: metadata.chapterTitle || '',
          allowExplanations: true,
          antiCheat: {
            shuffleQuestions: true,
            shuffleOptions: true,
            autoSubmitOnTimeout: true,
            warnTabSwitch: true,
            disallowPrevious: false,
            tabSwitchLimit: 3,
          },
          examPackage: generatedPackage,
        });

        if (pubRes.success && pubRes.code) {
          setShareModalState({
            isOpen: true,
            code: pubRes.code,
            title: metadata.examTitle || 'Đề kiểm tra AI',
          });
        }
      } catch (pubErr) {
        console.warn('Lỗi tự động lưu vào kho đề online:', pubErr);
      }

      // Automatically navigate to Exam Paper view
      setActiveTab('multicode');
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('[NO_API_KEY]') || msg.includes('Chưa cấu hình') || msg.includes('[INVALID_API_KEY]')) {
        setPendingMetadata(metadata);
        setIsApiKeyModalOpen(true);
      } else if (msg.includes('[QUOTA_EXHAUSTED]') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('Quota exceeded')) {
        setPendingMetadata(metadata);
        setIsQuotaModalOpen(true);
      } else {
        setNotificationModal({
          isOpen: true,
          title: 'Lỗi Sinh Đề Thi Với AI',
          message: msg || 'Không thể kết nối dịch vụ Gemini AI.',
        });
      }
      throw err;
    } finally {
      setIsGenerating(false);
      setProgressMessage('');
    }
  };

  // Seed sample questions for Manual Exam Builder
  const handleAddSampleQuestions = () => {
    const sampleItems: QuestionBankItem[] = [
      {
        id: 'sample_qb_1',
        partType: 'PART1',
        partTitle: 'Phần I: Câu hỏi trắc nghiệm 4 lựa chọn',
        number: 1,
        topic: 'Hàm số bậc hai',
        content: 'Cho hàm số $y = f(x) = x^2 - 4x + 3$. Tọa độ đỉnh $I$ của parabol là:',
        options: [
          { key: 'A', content: '$I(2; -1)$' },
          { key: 'B', content: '$I(-2; 15)$' },
          { key: 'C', content: '$I(4; 3)$' },
          { key: 'D', content: '$I(1; 0)$' },
        ],
        correctOption: 'A',
        explanation: 'Hoành độ đỉnh $x_I = -b/(2a) = 4/2 = 2$, tung độ $y_I = f(2) = 4 - 8 + 3 = -1$.',
        points: 0.25,
        cognitiveLevel: 'REMEMBER',
        subject: 'Toán',
        grade: 'Khối 10',
        chapter: 'Hàm số bậc hai',
        curriculum: 'Kết nối tri thức với cuộc sống',
        createdDate: new Date().toISOString(),
      },
      {
        id: 'sample_qb_2',
        partType: 'PART1',
        partTitle: 'Phần I: Câu hỏi trắc nghiệm 4 lựa chọn',
        number: 2,
        topic: 'Hàm số',
        content: 'Tập xác định của hàm số $y = \\sqrt{x - 2}$ là:',
        options: [
          { key: 'A', content: '$[2; +\\infty)$' },
          { key: 'B', content: '$(2; +\\infty)$' },
          { key: 'C', content: '$(-\\infty; 2]$' },
          { key: 'D', content: '$\\mathbb{R} \\setminus \\{2\\}$' },
        ],
        correctOption: 'A',
        explanation: 'Hàm số xác định khi $x - 2 \\ge 0 \\Leftrightarrow x \\ge 2$.',
        points: 0.25,
        cognitiveLevel: 'REMEMBER',
        subject: 'Toán',
        grade: 'Khối 10',
        chapter: 'Hàm số',
        curriculum: 'Kết nối tri thức với cuộc sống',
        createdDate: new Date().toISOString(),
      },
      {
        id: 'sample_qb_3',
        partType: 'PART2',
        partTitle: 'Phần II: Câu hỏi trắc nghiệm Đúng/Sai',
        number: 1,
        topic: 'Bất phương trình bậc hai',
        content: 'Cho bất phương trình $x^2 - 5x + 6 \\le 0$. Xét tính Đúng/Sai của các khẳng định sau:',
        trueFalseStatements: [
          { key: 'a', content: 'Tam thức bậc hai $f(x) = x^2 - 5x + 6$ có 2 nghiệm phân biệt $x = 2$ và $x = 3$.', isCorrect: true },
          { key: 'b', content: 'Tập nghiệm của bất phương trình là $S = (2; 3)$.', isCorrect: false },
          { key: 'c', content: 'Số nguyên $x = 2$ là một nghiệm của bất phương trình.', isCorrect: true },
          { key: 'd', content: 'Giá trị $x = 0$ thỏa mãn bất phương trình.', isCorrect: false },
        ],
        explanation: 'Bất phương trình có tập nghiệm đóng $[2; 3]$. Do đó b sai (vì dùng khoảng mở) và d sai.',
        points: 1.0,
        cognitiveLevel: 'UNDERSTAND',
        subject: 'Toán',
        grade: 'Khối 10',
        chapter: 'Bất phương trình bậc hai',
        curriculum: 'Kết nối tri thức với cuộc sống',
        createdDate: new Date().toISOString(),
      },
      {
        id: 'sample_qb_4',
        partType: 'PART3',
        partTitle: 'Phần III: Câu hỏi trả lời ngắn',
        number: 1,
        topic: 'Phương trình bậc hai',
        content: 'Tính tổng các nghiệm của phương trình $x^2 - 6x + 5 = 0$.',
        shortAnswer: '6',
        explanation: 'Theo định lý Vi-ét, $x_1 + x_2 = -b/a = 6$.',
        points: 0.25,
        cognitiveLevel: 'UNDERSTAND',
        subject: 'Toán',
        grade: 'Khối 10',
        chapter: 'Phương trình bậc hai',
        curriculum: 'Kết nối tri thức với cuộc sống',
        createdDate: new Date().toISOString(),
      },
      {
        id: 'sample_qb_5',
        partType: 'PART4',
        partTitle: 'Phần IV: Câu hỏi tự luận',
        number: 1,
        topic: 'Phương trình chứa căn',
        content: 'Giải phương trình $\\sqrt{x^2 - 3x + 2} = x - 1$.',
        essayAnswerGuide: 'ĐK: $x - 1 \\ge 0 \\Leftrightarrow x \\ge 1$. Bình phương 2 vế ta được: $x^2 - 3x + 2 = x^2 - 2x + 1 \\Leftrightarrow x = 1$ (Thỏa mãn).',
        explanation: 'ĐK: $x - 1 \\ge 0 \\Leftrightarrow x \\ge 1$. Bình phương 2 vế ta được: $x^2 - 3x + 2 = x^2 - 2x + 1 \\Leftrightarrow x = 1$ (Thỏa mãn).',
        points: 1.0,
        cognitiveLevel: 'APPLY',
        subject: 'Toán',
        grade: 'Khối 10',
        chapter: 'Phương trình chứa căn',
        curriculum: 'Kết nối tri thức với cuộc sống',
        createdDate: new Date().toISOString(),
      },
    ];

    StorageEngine.saveToQuestionBank(sampleItems);
    setQuestionBank(StorageEngine.getQuestionBank());
  };

  // Handlers for interactive edits
  const handleUpdateMatrix = (updatedMatrix: MatrixRow[]) => {
    if (!currentExamPackage) return;
    const updated = { ...currentExamPackage, matrix: updatedMatrix };
    setCurrentExamPackage(updated);
    StorageEngine.saveExamPackage(updated);
    setExamHistory(StorageEngine.getExamHistory());
  };

  const handleUpdateSpec = (updatedSpec: SpecRow[]) => {
    if (!currentExamPackage) return;
    const updated = { ...currentExamPackage, specification: updatedSpec };
    setCurrentExamPackage(updated);
    StorageEngine.saveExamPackage(updated);
    setExamHistory(StorageEngine.getExamHistory());
  };

  const handleUpdateQuestion = (code: string, updatedQuestion: Question) => {
    if (!currentExamPackage) return;
    const updatedExams = currentExamPackage.exams.map((ex) => {
      if (ex.code !== code) return ex;
      return {
        ...ex,
        questions: ex.questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
      };
    });

    const updated = { ...currentExamPackage, exams: updatedExams };
    setCurrentExamPackage(updated);
    StorageEngine.saveExamPackage(updated);
    setExamHistory(StorageEngine.getExamHistory());
  };

  const handleDeleteExamPackage = (id: string) => {
    StorageEngine.deleteExamPackage(id);
    const updatedHist = StorageEngine.getExamHistory();
    setExamHistory(updatedHist);
    if (currentExamPackage?.id === id) {
      setCurrentExamPackage(updatedHist[0] || null);
    }
  };

  // Question Bank CRUD
  const handleAddQBItem = (item: QuestionBankItem) => {
    StorageEngine.saveToQuestionBank([item]);
    setQuestionBank(StorageEngine.getQuestionBank());
  };

  const handleDeleteQBItem = (id: string) => {
    StorageEngine.deleteFromQuestionBank(id);
    setQuestionBank(StorageEngine.getQuestionBank());
  };

  // Export status toast state
  const [exportToast, setExportToast] = useState<{
    loading: boolean;
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  // Export handlers
  const handleExportWord = async (
    modeOrPack?: 'full' | 'exams' | 'answers' | ExamPackage,
    mode: 'full' | 'exams' | 'answers' = 'full'
  ) => {
    let target: ExamPackage | null = currentExamPackage;
    let exportMode: 'full' | 'exams' | 'answers' = mode;

    if (typeof modeOrPack === 'string') {
      exportMode = modeOrPack;
    } else if (modeOrPack) {
      target = modeOrPack;
    }

    if (!target) {
      setExportToast({
        loading: false,
        type: 'error',
        message: 'Chưa có đề thi nào trong hệ thống để xuất Word.',
      });
      setTimeout(() => setExportToast(null), 4000);
      return;
    }

    setExportToast({
      loading: true,
      type: 'info',
      message: 'Đang khởi tạo cấu trúc và chèn công thức Word (.docx)... Xin chờ giây lát.',
    });

    try {
      if (exportMode === 'exams') {
        await ExportDocx.exportExamsOnlyToDocx(target);
      } else if (exportMode === 'answers') {
        await ExportDocx.exportAnswerKeysOnlyToDocx(target);
      } else {
        await ExportDocx.exportPackageToWord(target);
      }

      setExportToast({
        loading: false,
        type: 'success',
        message: 'Xuất file Word (.docx) thành công! File đã được tải về máy.',
      });
      setTimeout(() => setExportToast(null), 4000);
    } catch (err: any) {
      console.error('Lỗi xuất Word:', err);
      setExportToast({
        loading: false,
        type: 'error',
        message: 'Không thể xuất file Word: ' + (err.message || 'Lỗi xử lý file'),
      });
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  const handleExportPdf = async (code?: string) => {
    if (!currentExamPackage) {
      setExportToast({
        loading: false,
        type: 'error',
        message: 'Chưa có gói đề thi nào để in / xuất PDF.',
      });
      setTimeout(() => setExportToast(null), 4000);
      return;
    }

    setExportToast({
      loading: true,
      type: 'info',
      message: 'Đang tải KaTeX và chuẩn bị giao diện in PDF...',
    });

    try {
      ExportPdf.printExamPackage(currentExamPackage, code);
      setExportToast({
        loading: false,
        type: 'success',
        message: 'Cửa sổ in / PDF đã được mở thành công!',
      });
      setTimeout(() => setExportToast(null), 3000);
    } catch (err: any) {
      console.error('Lỗi in PDF:', err);
      setExportToast({
        loading: false,
        type: 'error',
        message: 'Lỗi khi chuẩn bị in PDF: ' + (err.message || 'Lỗi trình duyệt'),
      });
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  const handleExportAnswerPdf = async (code?: string) => {
    if (!currentExamPackage) {
      setExportToast({
        loading: false,
        type: 'error',
        message: 'Chưa có dữ liệu đáp án để in / xuất PDF.',
      });
      setTimeout(() => setExportToast(null), 4000);
      return;
    }

    setExportToast({
      loading: true,
      type: 'info',
      message: 'Đang tải KaTeX và chuẩn bị giao diện in PDF Đáp án...',
    });

    try {
      ExportPdf.printAnswerKeys(currentExamPackage, code);
      setExportToast({
        loading: false,
        type: 'success',
        message: 'Cửa sổ in / PDF Đáp án đã được mở thành công!',
      });
      setTimeout(() => setExportToast(null), 3000);
    } catch (err: any) {
      console.error('Lỗi in PDF Đáp án:', err);
      setExportToast({
        loading: false,
        type: 'error',
        message: 'Lỗi khi chuẩn bị in PDF Đáp án: ' + (err.message || 'Lỗi trình duyệt'),
      });
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  const handleExportExcel = async () => {
    setExportToast({
      loading: true,
      type: 'info',
      message: 'Đang đóng gói dữ liệu và xuất file Excel (.xlsx)...',
    });

    try {
      if (currentExamPackage) {
        ExportExcel.exportAnswerKeysToExcel(currentExamPackage);
      } else if (questionBank.length > 0) {
        ExportExcel.exportQuestionBankToExcel(questionBank);
      } else {
        setExportToast({
          loading: false,
          type: 'error',
          message: 'Chưa có dữ liệu đề thi hoặc ngân hàng câu hỏi để xuất Excel.',
        });
        setTimeout(() => setExportToast(null), 4000);
        return;
      }

      setExportToast({
        loading: false,
        type: 'success',
        message: 'Xuất file Excel (.xlsx) thành công! File đã được tải về máy.',
      });
      setTimeout(() => setExportToast(null), 4000);
    } catch (err: any) {
      console.error('Lỗi xuất Excel:', err);
      setExportToast({
        loading: false,
        type: 'error',
        message: 'Lỗi khi xuất file Excel: ' + (err.message || 'Lỗi không xác định'),
      });
      setTimeout(() => setExportToast(null), 5000);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'visionos-bg-dark text-slate-100' : 'visionos-bg-light text-slate-900'} font-sans flex transition-colors`}>
      {/* If Student Exam tab is active, render full-screen student view */}
      {activeTab === 'student_exam' ? (
        <div className="w-full min-h-screen">
          <StudentExamView
            initialCode={studentInitialCode}
          />
        </div>
      ) : (
        <ProtectedRoute>
          {/* Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            theme={theme}
            setTheme={setTheme}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />

          {/* Main Content Area */}
          <div className={`flex-1 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} transition-all duration-300 flex flex-col min-w-0 min-h-screen`}>
            <Header
              title={
                activeTab === 'dashboard'
                  ? 'Dashboard Tổng Quan'
                  : activeTab === 'generator'
                  ? 'Tạo Đề Kiểm Tra chuẩn CV 7991'
                  : activeTab === 'online_bank'
                  ? 'Kho Đề Trực Tuyến Bằng Mã Đề'
                  : activeTab === 'student_results'
                  ? 'Kết Quả Học Sinh Làm Bài'
                  : activeTab === 'classes'
                  ? 'Quản Lý Lớp Học & Danh Sách Học Sinh'
                  : activeTab === 'matrix'
                  ? 'Ma Trận Đề Kiểm Tra'
                  : activeTab === 'specification'
                  ? 'Bảng Đặc Tả Yêu Cầu Cần Đạt'
                  : activeTab === 'bank'
                  ? 'Ngân Hàng Câu Hỏi'
                  : activeTab === 'multicode'
                  ? 'Sinh Nhiều Mã Đề'
                  : activeTab === 'answers'
                  ? 'Đáp Án & Rubric Chấm Bài'
                  : activeTab === 'user_management'
                  ? 'Quản Lý Tài Khoản Người Dùng'
                  : 'Cài Đặt Hệ Thống'
              }
              subtitle="Đánh giá năng lực học sinh THCS & THPT toàn quốc"
              onOpenMobileMenu={() => setIsSidebarOpen(true)}
              settings={settings}
              currentExamPackage={currentExamPackage}
              onOpenPublishModal={() => setShowPublishModal(true)}
              onExportWord={(mode) => handleExportWord(mode)}
              onExportPdf={() => handleExportPdf()}
              onExportExcel={() => handleExportExcel()}
            />

            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              {activeTab === 'dashboard' && (
                <DashboardView
                  examHistory={examHistory}
                  questionBank={questionBank}
                  onSelectExamPackage={(pack) => setCurrentExamPackage(pack)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onDeleteExamPackage={handleDeleteExamPackage}
                  onExportWord={(pack) => handleExportWord(pack)}
                />
              )}

              {activeTab === 'generator' && (
                <TestGeneratorView
                  settings={settings}
                  onGenerate={handleGenerateExam}
                  isGenerating={isGenerating}
                  progressMessage={progressMessage}
                />
              )}

              {activeTab === 'classes' && (
                <ClassManagementView
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'online_bank' && (
                <OnlineExamBankView
                  questionBank={questionBank}
                  onAddSampleQuestions={handleAddSampleQuestions}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectExamCodeForResults={(code) => setResultsSelectedCode(code)}
                  onOpenStudentExam={(code) => {
                    setStudentInitialCode(code);
                    setActiveTab('student_exam');
                  }}
                />
              )}

              {activeTab === 'student_results' && (
                <StudentResultsView
                  selectedExamCode={resultsSelectedCode}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'matrix' && (
                <MatrixView
                  examPackage={currentExamPackage}
                  onUpdateMatrix={handleUpdateMatrix}
                  onExportWord={() => handleExportWord()}
                  onExportExcel={() => handleExportExcel()}
                />
              )}

              {activeTab === 'specification' && (
                <SpecificationView
                  examPackage={currentExamPackage}
                  onUpdateSpec={handleUpdateSpec}
                  onExportWord={() => handleExportWord()}
                />
              )}

              {activeTab === 'bank' && (
                <QuestionBankView
                  questionBank={questionBank}
                  onAddQuestion={handleAddQBItem}
                  onDeleteQuestion={handleDeleteQBItem}
                  onExportExcel={() => handleExportExcel()}
                />
              )}

              {activeTab === 'multicode' && (
                <MultiCodeView
                  examPackage={currentExamPackage}
                  onExportWord={() => handleExportWord()}
                  onExportPdf={(code) => handleExportPdf(code)}
                  onExportExcel={() => handleExportExcel()}
                />
              )}

              {activeTab === 'answers' && (
                <AnswerKeyView
                  examPackage={currentExamPackage}
                  onExportWord={(mode) => handleExportWord(mode)}
                  onExportPdf={(code) => handleExportAnswerPdf(code)}
                />
              )}

              {activeTab === 'user_management' && (
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onClearAllData={handleClearAllData}
                />
              )}
            </main>
          </div>
        </ProtectedRoute>
      )}


      {/* Publish Online Exam Modal */}
      <PublishOnlineModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        examPackage={currentExamPackage}
        onPublishedSuccess={(code) => {
          setShareModalState({
            isOpen: true,
            code,
            title: currentExamPackage?.metadata?.title || 'Đề thi trực tuyến',
          });
        }}
      />

      {/* Share Code Modal */}
      <ShareExamModal
        isOpen={shareModalState.isOpen}
        onClose={() => setShareModalState({ isOpen: false, code: '', title: '' })}
        examCode={shareModalState.code}
        examTitle={shareModalState.title}
        onOpenStudentExam={(code) => {
          setStudentInitialCode(code);
          setActiveTab('student_exam');
        }}
      />

      {/* Export Status Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`p-4 rounded-2xl border shadow-2xl flex items-center justify-between space-x-3 ${
              exportToast.type === 'success'
                ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700'
                : exportToast.type === 'error'
                ? 'bg-rose-900/95 text-rose-100 border-rose-700'
                : 'bg-slate-900/95 text-slate-100 border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              {exportToast.loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-teal-400 shrink-0" />
              ) : exportToast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <p className="text-xs font-semibold leading-snug">{exportToast.message}</p>
            </div>
            <button
              onClick={() => setExportToast(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Modals for API Key & Quota */}
      <ApiKeyInputModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={(newKey) => {
          setIsApiKeyModalOpen(false);
          const updatedSettings = { ...settings, customApiKey: newKey };
          setSettings(updatedSettings);
          if (pendingMetadata) {
            handleGenerateExam(pendingMetadata).catch(() => {});
          }
        }}
      />

      <QuotaExceededModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        onSaveNewKeyAndRetry={(newKey) => {
          setIsQuotaModalOpen(false);
          if (newKey) {
            const updatedSettings = { ...settings, customApiKey: newKey };
            setSettings(updatedSettings);
          }
          if (pendingMetadata) {
            handleGenerateExam(pendingMetadata).catch(() => {});
          }
        }}
      />

      <NotificationModal
        isOpen={notificationModal.isOpen}
        title={notificationModal.title}
        message={notificationModal.message}
        onClose={() => setNotificationModal({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
}
