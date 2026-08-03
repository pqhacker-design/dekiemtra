import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Copy,
  Clock,
  Eye,
  FileText,
  Filter,
  Link as LinkIcon,
  Lock,
  PlusCircle,
  QrCode,
  RefreshCw,
  Search,
  Share2,
  Sliders,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import { OnlineExamItem, OnlineExamService } from '../services/onlineExamService';
import { QuestionBankItem } from '../types';
import { ShareExamModal } from './ShareExamModal';
import { ManualExamModal } from './ManualExamModal';
import { EditExamQuestionsModal } from './EditExamQuestionsModal';

interface OnlineExamBankViewProps {
  questionBank?: QuestionBankItem[];
  onAddSampleQuestions?: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectExamCodeForResults: (code: string) => void;
  onOpenStudentExam: (code: string) => void;
}

export const OnlineExamBankView: React.FC<OnlineExamBankViewProps> = ({
  questionBank = [],
  onAddSampleQuestions,
  onNavigateTab,
  onSelectExamCodeForResults,
  onOpenStudentExam,
}) => {
  const [exams, setExams] = useState<OnlineExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'locked'>('ALL');

  // Manual Exam Builder Modal State
  const [showManualModal, setShowManualModal] = useState(false);

  // Toast feedback for link copying
  const [copiedLinkCode, setCopiedLinkCode] = useState<string | null>(null);

  // Share Modal State
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    code: string;
    title: string;
  }>({ isOpen: false, code: '', title: '' });

  // Edit Points Modal State
  const [editPointsCode, setEditPointsCode] = useState<string | null>(null);

  // Delete modal
  const [deleteCode, setDeleteCode] = useState<string | null>(null);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await OnlineExamService.listExams();
      if (res.success) {
        setExams(res.exams || []);
      }
    } catch (err: any) {
      console.error('Lỗi lấy danh sách kho đề:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCopyExamLink = (code: string) => {
    const base = window.location.origin + window.location.pathname;
    const link = `${base.replace(/\/$/, '')}?exam=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkCode(code);
    setTimeout(() => setCopiedLinkCode(null), 2500);
  };

  const handleToggleLock = async (exam: OnlineExamItem) => {
    const newStatus = exam.status === 'active' ? 'locked' : 'active';
    try {
      await OnlineExamService.updateExam(exam.code, { status: newStatus });
      setExams((prev) =>
        prev.map((e) => (e.code === exam.code ? { ...e, status: newStatus } : e))
      );
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái đề thi: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteCode) return;
    try {
      await OnlineExamService.deleteExam(deleteCode);
      setExams((prev) => prev.filter((e) => e.code !== deleteCode));
      setDeleteCode(null);
    } catch (err: any) {
      alert('Không thể xóa đề thi: ' + err.message);
    }
  };

  // Filter logic
  const filteredExams = exams.filter((exam) => {
    const matchSearch =
      exam.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSubject = subjectFilter === 'ALL' || exam.subject === subjectFilter;
    const matchGrade = gradeFilter === 'ALL' || exam.grade === gradeFilter;
    const matchStatus = statusFilter === 'ALL' || exam.status === statusFilter;

    return matchSearch && matchSubject && matchGrade && matchStatus;
  });

  const subjects = Array.from(new Set(exams.map((e) => e.subject))).filter(Boolean);
  const grades = Array.from(new Set(exams.map((e) => e.grade))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 dark:from-slate-900 dark:to-slate-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-teal-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5 text-teal-300" />
            <span>Hệ Thống Đề Thi Trực Tuyến</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Kho Đề Trực Tuyến Bằng Mã Đề</h2>
          <p className="text-xs text-teal-200/90 max-w-2xl">
            Quản lý kho đề kiểm tra đã lưu, cấp mã đề ngẫu nhiên cho học sinh làm bài online, theo dõi tiến độ nộp bài và xem thống kê kết quả tức thì.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={fetchExams}
            className="p-3 bg-teal-800/80 hover:bg-teal-700 text-teal-100 rounded-2xl border border-teal-600/50 transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-3 bg-teal-700 hover:bg-teal-600 text-white font-extrabold rounded-2xl text-xs shadow-md border border-teal-500/40 transition-colors flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Tạo Đề Thủ Công Từ Ngân Hàng</span>
          </button>

          <button
            onClick={() => onNavigateTab('generator')}
            className="px-5 py-3 bg-teal-400 hover:bg-teal-300 text-teal-950 font-extrabold rounded-2xl text-xs shadow-lg transition-colors flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo Đề Mới Với AI</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo Mã đề, Tên đề thi, Môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả Môn học</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả Khối lớp</option>
            {grades.map((grd) => (
              <option key={grd} value={grd}>
                {grd}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="active">Đang mở</option>
            <option value="locked">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* List / Grid of Exams */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Đang tải danh sách kho đề trực tuyến...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Chưa có đề thi trực tuyến nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy nhấn "Tạo Đề Mới Với AI" hoặc chọn bất kỳ đề thi nào trong danh mục đã sinh và nhấn "Lưu đề" để cấp mã trực tuyến cho học sinh.
          </p>
          <button
            onClick={() => onNavigateTab('generator')}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-2xl text-xs font-bold inline-flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo đề đầu tiên ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {/* Exam Code Badge */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-base font-mono font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800/50">
                      {exam.code}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(exam.code);
                        alert(`Đã chép mã đề: ${exam.code}`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Chép mã đề"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Badge & Management Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                        exam.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {exam.status === 'active' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Đang mở</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Đã khóa</span>
                        </>
                      )}
                    </span>

                    {/* Toggle Lock Button */}
                    <button
                      onClick={() => handleToggleLock(exam)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        exam.status === 'active'
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                      title={exam.status === 'active' ? 'Khóa đề thi' : 'Mở lại đề thi'}
                    >
                      {exam.status === 'active' ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeleteCode(exam.code)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Xóa đề thi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug">
                  {exam.title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-semibold text-slate-700 dark:text-slate-300">
                    {exam.subject}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-semibold text-slate-700 dark:text-slate-300">
                    {exam.grade}
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>{exam.duration} phút</span>
                  </span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Số câu hỏi</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {exam.questionCount} câu
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Học sinh đã nộp</div>
                  <div className="font-bold text-teal-600 dark:text-teal-400 flex items-center justify-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{exam.submissionCount} lượt</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer - Grid layout inside card padding */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {/* Share Button */}
                <button
                  onClick={() =>
                    setShareModalData({ isOpen: true, code: exam.code, title: exam.title })
                  }
                  className="w-full justify-center px-1.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center space-x-1 transition-colors shadow-xs cursor-pointer text-[11px]"
                  title="Xem mã QR & tùy chọn chia sẻ"
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Cấp mã</span>
                </button>

                {/* Copy Link Button */}
                <button
                  onClick={() => handleCopyExamLink(exam.code)}
                  className={`w-full justify-center px-1.5 py-2 font-bold rounded-xl flex items-center space-x-1 transition-colors cursor-pointer text-[11px] ${
                    copiedLinkCode === exam.code
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-200 dark:border-teal-800'
                  }`}
                  title="Chép link làm bài cho HS"
                >
                  <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{copiedLinkCode === exam.code ? 'Đã chép!' : 'Chép link'}</span>
                </button>

                {/* View Results Button */}
                <button
                  onClick={() => {
                    onSelectExamCodeForResults(exam.code);
                    onNavigateTab('student_results');
                  }}
                  className="w-full justify-center px-1.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center space-x-1 transition-colors cursor-pointer text-[11px]"
                  title="Xem kết quả học sinh đã nộp"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">Kết quả</span>
                </button>

                {/* Edit Points Button */}
                <button
                  onClick={() => setEditPointsCode(exam.code)}
                  className="w-full justify-center px-1.5 py-2 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold rounded-xl flex items-center space-x-1 transition-colors cursor-pointer text-[11px]"
                  title="Xem lại & Điều chỉnh điểm số từng câu"
                >
                  <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate">Sửa điểm</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      <ShareExamModal
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData({ isOpen: false, code: '', title: '' })}
        examCode={shareModalData.code}
        examTitle={shareModalData.title}
        onOpenStudentExam={onOpenStudentExam}
      />

      {/* Manual Exam Builder Modal */}
      <ManualExamModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        questionBank={questionBank}
        onAddSampleQuestions={onAddSampleQuestions}
        onPublishedSuccess={(code, title) => {
          fetchExams();
          setShareModalData({ isOpen: true, code, title });
        }}
      />

      {/* Edit Questions & Points Modal */}
      <EditExamQuestionsModal
        isOpen={!!editPointsCode}
        examCode={editPointsCode || ''}
        onClose={() => setEditPointsCode(null)}
        onSavedSuccess={fetchExams}
      />

      {/* Delete Confirmation Modal */}
      {deleteCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Xác nhận xóa đề thi?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hành động này sẽ xóa vĩnh viễn đề thi <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{deleteCode}</span> khỏi kho đề trực tuyến.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteCode(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
