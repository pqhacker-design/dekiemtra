import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckSquare,
  Clock,
  Filter,
  List,
  PlusCircle,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  Sliders,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { QuestionBankItem, ExamPackage } from '../types';
import { OnlineExamService } from '../services/onlineExamService';
import { StorageEngine } from '../services/storageEngine';
import { MathText } from './MathText';
import { QuestionDetailCard } from './QuestionDetailCard';

interface ManualExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionBank: QuestionBankItem[];
  onAddSampleQuestions?: () => void;
  onPublishedSuccess: (code: string, title: string) => void;
}

export const ManualExamModal: React.FC<ManualExamModalProps> = ({
  isOpen,
  onClose,
  questionBank,
  onAddSampleQuestions,
  onPublishedSuccess,
}) => {
  const [examTitle, setExamTitle] = useState('Đề kiểm tra chọn lọc thủ công');
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('Khối 10');
  const [duration, setDuration] = useState(45);

  // Tab view: Select from bank OR Review & Edit Points
  const [activeTab, setActiveTab] = useState<'SELECT' | 'REVIEW'>('SELECT');

  // Custom Points map per question ID
  const [customPoints, setCustomPoints] = useState<Record<string, number>>({});

  // Filters for Question Bank
  const [searchTerm, setSearchTerm] = useState('');
  const [partTypeFilter, setPartTypeFilter] = useState<'ALL' | 'PART1' | 'PART2' | 'PART3' | 'PART4'>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('AUTO');
  const [subjectFilter, setSubjectFilter] = useState<string>('AUTO');

  // Selected Question IDs
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Anti-cheat options
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [autoSubmitOnTimeout, setAutoSubmitOnTimeout] = useState(true);
  const [warnTabSwitch, setWarnTabSwitch] = useState(true);
  const [allowExplanations, setAllowExplanations] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const normalizeGradeDigits = (g?: string) => (g ? g.replace(/\D/g, '') : '');

  const isGradeMatching = (itemGrade?: string, targetFilter?: string, currentGrade?: string) => {
    const activeGrade = targetFilter === 'AUTO' ? currentGrade : targetFilter;
    if (!activeGrade || activeGrade === 'ALL') return true;
    if (!itemGrade) return true;

    const itemDigits = normalizeGradeDigits(itemGrade);
    const targetDigits = normalizeGradeDigits(activeGrade);

    if (itemDigits && targetDigits) {
      return itemDigits === targetDigits;
    }
    return itemGrade.toLowerCase().includes(activeGrade.toLowerCase()) || activeGrade.toLowerCase().includes(itemGrade.toLowerCase());
  };

  const isSubjectMatching = (itemSubject?: string, targetFilter?: string, currentSubject?: string) => {
    const activeSubject = targetFilter === 'AUTO' ? currentSubject : targetFilter;
    if (!activeSubject || activeSubject === 'ALL') return true;
    if (!itemSubject) return true;

    return itemSubject.toLowerCase().trim() === activeSubject.toLowerCase().trim();
  };

  // Filtered Question Bank Items
  const filteredQB = questionBank.filter((item) => {
    const matchSearch =
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.chapter && item.chapter.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchPart = partTypeFilter === 'ALL' || item.partType === partTypeFilter;
    const matchSubject = isSubjectMatching(item.subject, subjectFilter, subject);
    const matchGrade = isGradeMatching(item.grade, gradeFilter, grade);

    return matchSearch && matchPart && matchSubject && matchGrade;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredQB.map((q) => q.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Point helper for a question
  const getQuestionPoint = (q: QuestionBankItem): number => {
    if (customPoints[q.id] !== undefined) return customPoints[q.id];
    if (q.points !== undefined && q.points !== null) return q.points;
    if (q.partType === 'PART2' || q.partType === 'PART4') return 1.0;
    return 0.25;
  };

  const handlePointChange = (qId: string, pt: number) => {
    const validPt = Math.max(0.01, Math.min(10, Math.round(pt * 100) / 100));
    setCustomPoints((prev) => ({ ...prev, [qId]: validPt }));
  };

  // Selected items calculation
  const selectedQuestions = questionBank.filter((q) => selectedIds.includes(q.id));
  const totalPointsSelected = selectedQuestions.reduce((acc, q) => acc + getQuestionPoint(q), 0);
  const roundedTotalPoints = Math.round(totalPointsSelected * 100) / 100;

  // Preset point actions
  const applyPresetPart = (partType: string, points: number) => {
    setCustomPoints((prev) => {
      const next = { ...prev };
      selectedQuestions.forEach((q) => {
        if (q.partType === partType || (!q.partType && partType === 'PART1')) {
          next[q.id] = points;
        }
      });
      return next;
    });
  };

  const divideTenPointsEvenly = () => {
    if (selectedQuestions.length === 0) return;
    const perQ = Math.round((10 / selectedQuestions.length) * 100) / 100;
    setCustomPoints((prev) => {
      const next = { ...prev };
      selectedQuestions.forEach((q) => {
        next[q.id] = perQ;
      });
      return next;
    });
  };

  const handleCreateAndPublish = async () => {
    if (selectedQuestions.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng.');
      return;
    }

    if (!examTitle.trim()) {
      setErrorMsg('Vui lòng nhập Tên đề thi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Format selected questions into standard Exam package
      const formattedQuestions = selectedQuestions.map((q, idx) => {
        const pt = getQuestionPoint(q);
        return {
          ...q,
          number: idx + 1,
          points: pt,
          partTitle:
            q.partTitle ||
            (q.partType === 'PART1'
              ? 'PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn'
              : q.partType === 'PART2'
              ? 'PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai'
              : q.partType === 'PART3'
              ? 'PHẦN III. Câu hỏi trả lời ngắn'
              : 'PHẦN IV. Viết (Tự luận)'),
          correctOption: q.correctOption || (q as any).correctAnswer || 'A',
          correctAnswer: q.correctOption || (q as any).correctAnswer || q.shortAnswer || '',
          shortAnswer: q.shortAnswer || '',
          essayAnswerGuide: q.essayAnswerGuide || q.explanation || '',
        };
      });

      const mockPackage: ExamPackage = {
        id: 'pkg_manual_' + Date.now(),
        createdAt: new Date().toISOString(),
        metadata: {
          schoolName: 'Trường THCS / THPT',
          departmentName: 'Sở GD&ĐT',
          subject: subject as any,
          grade,
          className: 'Tất cả các lớp',
          semester: 'Học kỳ I',
          schoolYear: '2025 - 2026',
          examTitle,
          chapterTitle: 'Tạo đề thủ công từ ngân hàng',
          durationMinutes: duration,
          totalPoints: roundedTotalPoints,
          curriculum: 'Chương trình GDPT 2018 khác',
          examMode: 'MCQ_ESSAY',
          questionCounts: {
            part1_MCQSingle: formattedQuestions.filter((q) => q.partType === 'PART1' || !q.partType).length,
            part1_PointsPerQuestion: 0.25,
            part2_MCQTrueFalse: formattedQuestions.filter((q) => q.partType === 'PART2').length,
            part2_PointsPerQuestion: 1.0,
            part3_MCQShort: formattedQuestions.filter((q) => q.partType === 'PART3').length,
            part3_PointsPerQuestion: 0.25,
            part4_Essay: formattedQuestions.filter((q) => q.partType === 'PART4').length,
            part4_ApplyCount: 0,
            part4_AdvancedCount: 0,
            part4_AdvancedPoints: 1.0,
          },
          cognitiveRatio: { remember: 40, understand: 30, apply: 20, advanced: 10 },
          codeCount: 1,
        },
        matrix: [],
        specification: [],
        exams: [
          {
            code: '101',
            questions: formattedQuestions,
          },
        ],
        answerKeys: [
          {
            code: '101',
            part1Answers: formattedQuestions
              .filter((q) => q.partType === 'PART1' || !q.partType)
              .map((q) => ({
                questionNumber: q.number,
                correctOption: q.correctOption || q.correctAnswer || 'A',
                points: q.points || 0.25,
              })),
            part2Answers: formattedQuestions
              .filter((q) => q.partType === 'PART2')
              .map((q) => ({
                questionNumber: q.number,
                statements: (q.trueFalseStatements || []).map((st) => ({
                  key: st.key,
                  isCorrect: st.isCorrect !== undefined ? st.isCorrect : (st as any).isTrue,
                })),
                points: q.points || 1.0,
              })),
            part3Answers: formattedQuestions
              .filter((q) => q.partType === 'PART3')
              .map((q) => ({
                questionNumber: q.number,
                shortAnswer: q.shortAnswer || q.correctAnswer || '',
                points: q.points || 0.25,
              })),
            part4Answers: formattedQuestions
              .filter((q) => q.partType === 'PART4')
              .map((q) => ({
                questionNumber: q.number,
                essayAnswerGuide: q.essayAnswerGuide || q.explanation || '',
                points: q.points || 1.0,
              })),
          },
        ],
      };

      // Save locally
      StorageEngine.saveExamPackage(mockPackage);

      // Save to Backend Online Server DB
      const res = await OnlineExamService.saveExam({
        title: examTitle,
        subject,
        grade,
        duration,
        totalPoints: roundedTotalPoints,
        topic: 'Tạo đề thủ công',
        allowExplanations,
        antiCheat: {
          shuffleQuestions,
          shuffleOptions,
          autoSubmitOnTimeout,
          warnTabSwitch,
          disallowPrevious: false,
          tabSwitchLimit: 3,
        },
        examPackage: mockPackage,
      });

      if (res.success && res.code) {
        onPublishedSuccess(res.code, examTitle);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tạo đề thi trực tuyến.');
    } finally {
      setLoading(false);
    }
  };

  const subjects = Array.from(new Set(questionBank.map((q) => q.subject))).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative space-y-5 my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pr-8">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Tạo Đề Thi Trực Tuyến Thủ Công
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chọn lọc câu hỏi từ Ngân hàng và điều chỉnh điểm số từng câu trước khi phát hành đề thi
              </p>
            </div>
          </div>

          {/* View Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 shrink-0">
            <button
              onClick={() => setActiveTab('SELECT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'SELECT'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Ngân hàng ({questionBank.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('REVIEW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'REVIEW'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Xem lại & Chỉnh điểm ({selectedQuestions.length})</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs shrink-0 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Tên đề thi (*):
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Môn học:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Khối lớp:</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="Khối 6">Khối 6</option>
              <option value="Khối 7">Khối 7</option>
              <option value="Khối 8">Khối 8</option>
              <option value="Khối 9">Khối 9</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Thời gian (Phút):
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-hidden font-bold text-center"
            />
          </div>
        </div>

        {/* TAB 1: SELECT QUESTIONS FROM BANK */}
        {activeTab === 'SELECT' && (
          <>
            {/* Filter Toolbar for Questions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung câu hỏi trong ngân hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium"
                >
                  <option value="AUTO">Khối: {grade}</option>
                  <option value="ALL">Tất cả Khối lớp</option>
                  <option value="Khối 6">Chỉ Khối 6</option>
                  <option value="Khối 7">Chỉ Khối 7</option>
                  <option value="Khối 8">Chỉ Khối 8</option>
                  <option value="Khối 9">Chỉ Khối 9</option>
                  <option value="Khối 10">Chỉ Khối 10</option>
                  <option value="Khối 11">Chỉ Khối 11</option>
                  <option value="Khối 12">Chỉ Khối 12</option>
                </select>

                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium"
                >
                  <option value="AUTO">Môn: {subject}</option>
                  <option value="ALL">Tất cả Môn học</option>
                  {subjects.map((sub) => (
                    <option key={sub} value={sub}>
                      Chỉ môn {sub}
                    </option>
                  ))}
                </select>

                <select
                  value={partTypeFilter}
                  onChange={(e) => setPartTypeFilter(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden font-medium"
                >
                  <option value="ALL">Tất cả Dạng câu</option>
                  <option value="PART1">Phần I: TN 4 Lựa chọn</option>
                  <option value="PART2">Phần II: TN Đúng/Sai</option>
                  <option value="PART3">Phần III: Trả lời ngắn</option>
                  <option value="PART4">Phần IV: Tự luận</option>
                </select>

                <button
                  onClick={toggleSelectAllFiltered}
                  className="px-3 py-2 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl font-bold flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                  <span>Chọn / Bỏ ({filteredQB.length})</span>
                </button>
              </div>
            </div>

            {/* Question Selector Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[220px]">
              {questionBank.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">
                    Ngân hàng câu hỏi hiện chưa có dữ liệu.
                  </p>
                  {onAddSampleQuestions && (
                    <button
                      onClick={onAddSampleQuestions}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Thêm 10 câu hỏi mẫu CV 7991 ngay</span>
                    </button>
                  )}
                </div>
              ) : filteredQB.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">
                  Không tìm thấy câu hỏi phù hợp với bộ lọc tìm kiếm.
                </p>
              ) : (
                filteredQB.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <QuestionDetailCard
                      key={item.id}
                      question={item}
                      questionNumber={idx + 1}
                      selectable={true}
                      isSelected={isSelected}
                      onToggleSelect={() => toggleSelect(item.id)}
                      showAnswers={true}
                      showExplanation={true}
                      defaultExpandedExplanation={false}
                    />
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: REVIEW & EDIT POINTS */}
        {activeTab === 'REVIEW' && (
          <div className="flex-1 flex flex-col min-h-[250px] space-y-3">
            {/* Presets Toolbar */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 shrink-0 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  Danh Sách {selectedQuestions.length} Câu Đã Chọn trong Đề Thi
                </div>
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="text-slate-500">Tổng điểm:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                    {roundedTotalPoints} điểm
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Gán điểm nhanh:
                </span>
                <button
                  onClick={() => applyPresetPart('PART1', 0.25)}
                  className="px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Phần I = 0.25đ
                </button>
                <button
                  onClick={() => applyPresetPart('PART2', 1.0)}
                  className="px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Phần II = 1.0đ
                </button>
                <button
                  onClick={() => applyPresetPart('PART3', 0.25)}
                  className="px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Phần III = 0.25đ
                </button>
                <button
                  onClick={() => applyPresetPart('PART4', 1.0)}
                  className="px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Phần IV = 1.0đ
                </button>
                <button
                  onClick={divideTenPointsEvenly}
                  className="px-2 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-lg border border-teal-300 dark:border-teal-800 font-bold hover:bg-teal-100 transition-colors cursor-pointer ml-auto"
                >
                  Chia đều 10 điểm
                </button>
              </div>
            </div>

            {/* Questions List with Point Inputs */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {selectedQuestions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có câu hỏi nào được chọn. Vui lòng chuyển sang tab "Ngân hàng" để chọn câu hỏi.
                </div>
              ) : (
                selectedQuestions.map((q, idx) => {
                  const pt = getQuestionPoint(q);
                  return (
                    <div
                      key={q.id}
                      className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-teal-700 dark:text-teal-400">
                            Câu {idx + 1}.
                          </span>
                          <span className="px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px]">
                            {q.partType === 'PART1' || !q.partType
                              ? 'TN 4 Lựa chọn'
                              : q.partType === 'PART2'
                              ? 'TN Đúng/Sai'
                              : q.partType === 'PART3'
                              ? 'Trả lời ngắn'
                              : 'Tự luận'}
                          </span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-500">Điểm:</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0.05"
                            max="10"
                            value={pt}
                            onChange={(e) => handlePointChange(q.id, parseFloat(e.target.value) || 0.05)}
                            className="w-16 bg-slate-50 dark:bg-slate-900 text-center font-bold font-mono text-xs py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-teal-700 dark:text-teal-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                          />
                          <span className="font-bold text-slate-600 dark:text-slate-400">đ</span>

                          <div className="hidden sm:flex items-center space-x-1 pl-1">
                            {[0.25, 0.5, 1.0, 1.5, 2.0].map((preset) => (
                              <button
                                key={preset}
                                onClick={() => handlePointChange(q.id, preset)}
                                className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                                  pt === preset
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {preset}đ
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => toggleSelect(q.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer ml-1"
                            title="Xóa khỏi đề"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed pl-1">
                        <MathText content={q.content} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Selected Summary Footer Bar */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-3">
            <div>
              Đã chọn: <span className="text-teal-600 dark:text-teal-400 font-extrabold text-sm">{selectedIds.length}</span> câu
            </div>
            <div>|</div>
            <div>
              Tổng điểm đề thi: <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm font-mono">{roundedTotalPoints}</span> điểm
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {activeTab === 'SELECT' && selectedIds.length > 0 && (
              <button
                onClick={() => setActiveTab('REVIEW')}
                className="px-4 py-2.5 bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Xem lại & Chỉnh điểm ({selectedIds.length} câu)
              </button>
            )}

            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>

            <button
              onClick={handleCreateAndPublish}
              disabled={loading || selectedIds.length === 0}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Đang tạo...' : 'Tạo Đề & Cấp Mã Online'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

