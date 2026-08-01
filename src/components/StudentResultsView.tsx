import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { OnlineExamService, StudentResultItem } from '../services/onlineExamService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface StudentResultsViewProps {
  selectedExamCode?: string;
  onNavigateTab: (tab: any) => void;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({
  selectedExamCode = 'ALL',
  onNavigateTab,
}) => {
  const [results, setResults] = useState<StudentResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [examCodeFilter, setExamCodeFilter] = useState<string>(selectedExamCode);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');

  // Detail Modal State
  const [detailModalItem, setDetailModalItem] = useState<StudentResultItem | null>(null);

  // Custom Confirm Modal & Toast state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'retake';
    item: StudentResultItem;
    title: string;
    message: string;
  } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await OnlineExamService.getTeacherResults(examCodeFilter);
      if (res.success) {
        setResults(res.results || []);
      }
    } catch (err: any) {
      console.error('Lỗi lấy danh sách kết quả học sinh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [examCodeFilter]);

  const requestDeleteResult = (item: StudentResultItem) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      item,
      title: 'Xóa Bài Làm Của Học Sinh',
      message: `Bạn có chắc chắn muốn xóa bài làm của học sinh "${item.studentName}" (Lớp ${item.studentClass}, Mã đề [${item.examCode}])?`,
    });
  };

  const requestAllowRetake = (item: StudentResultItem) => {
    setConfirmModal({
      isOpen: true,
      type: 'retake',
      item,
      title: 'Cho Phép Học Sinh Làm Lại Bài Thi',
      message: `Cho phép học sinh "${item.studentName}" (Lớp ${item.studentClass}) làm lại bài thi mã đề [${item.examCode}]? Hành động này sẽ xóa lượt làm bài cũ để SBD/Học sinh có thể đăng nhập và làm lại bài thi mới.`,
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, item } = confirmModal;
    setConfirmModal(null);

    if (type === 'delete') {
      try {
        await OnlineExamService.deleteResult(item.id);
        setResults((prev) => prev.filter((r) => r.id !== item.id));
        showToast('success', `Đã xóa bài làm của học sinh ${item.studentName}.`);
      } catch (err: any) {
        showToast('error', 'Không thể xóa bài làm: ' + err.message);
      }
    } else if (type === 'retake') {
      try {
        const res = await OnlineExamService.resetStudentSession({
          sessionId: item.id,
          examCode: item.examCode,
          sbd: item.studentSbd || item.studentId,
          studentName: item.studentName,
        });
        if (res.success) {
          setResults((prev) => prev.filter((r) => r.id !== item.id));
          showToast('success', res.message || `Đã cho phép học sinh ${item.studentName} làm lại bài thi.`);
        }
      } catch (err: any) {
        showToast('error', 'Không thể cấp phép làm lại: ' + err.message);
      }
    }
  };

  // Filtering
  const filteredResults = results.filter((item) => {
    const matchSearch =
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.examCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchClass = classFilter === 'ALL' || item.studentClass === classFilter;

    return matchSearch && matchClass;
  });

  const availableClasses = Array.from(new Set(results.map((r) => r.studentClass))).filter(Boolean);
  const availableExams = Array.from(new Set(results.map((r) => r.examCode))).filter(Boolean);

  // Stats calculation
  const totalSubmissions = filteredResults.length;
  const avgScore =
    totalSubmissions > 0
      ? (filteredResults.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalSubmissions).toFixed(2)
      : '0.00';
  const passRate =
    totalSubmissions > 0
      ? (
          (filteredResults.filter((r) => r.score >= 5.0).length / totalSubmissions) *
          100
        ).toFixed(1)
      : '0.0';
  const totalCheatingAlerts = filteredResults.reduce((acc, curr) => acc + (curr.tabSwitches || 0), 0);

  // Export Excel
  const handleExportExcel = () => {
    if (filteredResults.length === 0) {
      alert('Không có dữ liệu kết quả để xuất Excel.');
      return;
    }

    const excelData = filteredResults.map((item, idx) => ({
      STT: idx + 1,
      'Mã Đề': item.examCode,
      'Họ Và Tên': item.studentName,
      Lớp: item.studentClass,
      Trường: item.studentSchool || '---',
      'Thời Gian Bắt Đầu': new Date(item.startTime).toLocaleString('vi-VN'),
      'Thời Gian Nộp': item.submitTime ? new Date(item.submitTime).toLocaleString('vi-VN') : '---',
      'Thời Gian Làm Bài (Phút)': item.durationMinutes,
      'Số Câu Đúng': `${item.correctCount}/${item.totalQuestions}`,
      'Điểm Số': item.score,
      'Cảnh Báo Chuyển Tab': item.tabSwitches,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KetQuaHocSinh');
    XLSX.writeFile(workbook, `KetQuaHocSinh_MaDe_${examCodeFilter}.xlsx`);
  };

  // Export PDF Summary
  const handleExportPdf = () => {
    if (filteredResults.length === 0) {
      alert('Không có dữ liệu kết quả để xuất PDF.');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`BANG KET QUA BAI THI TRUC TUYEN - MA DE ${examCodeFilter}`, 14, 20);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Tong so bai nop: ${totalSubmissions} | Diem trung binh: ${avgScore} | Ty le dat: ${passRate}%`, 14, 28);

    let y = 38;
    doc.setFont('Helvetica', 'bold');
    doc.text('STT | Ho Ten | Lop | Ma De | Diem | So Cau Dung | Thoi Gian | Canh Bao', 14, y);
    doc.line(14, y + 2, 195, y + 2);
    y += 8;

    doc.setFont('Helvetica', 'normal');
    filteredResults.forEach((r, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const line = `${idx + 1}. ${r.studentName} | ${r.studentClass} | ${r.examCode} | ${r.score}đ | ${r.correctCount}/${r.totalQuestions} | ${r.durationMinutes} phut | ${r.tabSwitches} lan`;
      doc.text(line, 14, y);
      y += 7;
    });

    doc.save(`BangKetQua_MaDe_${examCodeFilter}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-teal-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>Thống Kê Báo Cáo Thi Trực Tuyến</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Kết Quả Học Sinh Làm Bài</h2>
          <p className="text-xs text-teal-200/90 max-w-2xl">
            Theo dõi chi tiết điểm số, thời gian nộp bài, số câu đúng/sai và nhật ký vi phạm chống gian lận của học sinh theo từng mã đề thi.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={fetchResults}
            className="p-3 bg-teal-800/80 hover:bg-teal-700 text-teal-100 rounded-2xl border border-teal-600/50 transition-colors"
            title="Làm mới bảng điểm"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-colors flex items-center space-x-1.5 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-colors flex items-center space-x-1.5 shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Tổng Lượt Nộp Bài</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalSubmissions}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Điểm Trung Bình</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{avgScore}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Tỷ Lệ Đạt (≥ 5.0đ)</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{passRate}%</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Cảnh Báo Gian Lận</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {totalCheatingAlerts} <span className="text-xs font-normal">lần</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo Họ tên học sinh, Lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        {/* Exam Code Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={examCodeFilter}
            onChange={(e) => setExamCodeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-hidden"
          >
            <option value="ALL">Mã Đề: Tất cả đề thi</option>
            {availableExams.map((code) => (
              <option key={code} value={code}>
                Mã Đề: {code}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">Tất cả các Lớp</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                Lớp {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Đang tải bảng kết quả bài thi học sinh...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Chưa có kết quả học sinh nộp bài
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Khi học sinh truy cập vào mã đề thi và hoàn thành nộp bài, toàn bộ bảng điểm và nhật ký thi sẽ được hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">STT</th>
                  <th className="p-4">Họ Và Tên</th>
                  <th className="p-4">Lớp / Trường</th>
                  <th className="p-4">Mã Đề</th>
                  <th className="p-4">Thời Gian Nộp</th>
                  <th className="p-4 text-center">Thời Gian Làm</th>
                  <th className="p-4 text-center">Số Câu Đúng</th>
                  <th className="p-4 text-center">Điểm Số</th>
                  <th className="p-4 text-center">Gian Lận</th>
                  <th className="p-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredResults.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{item.studentName}</td>
                    <td className="p-4">
                      <div className="font-semibold">{item.studentClass}</div>
                      {item.studentSchool && (
                        <div className="text-[10px] text-slate-400">{item.studentSchool}</div>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {item.examCode}
                    </td>
                    <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.submitTime ? new Date(item.submitTime).toLocaleString('vi-VN') : '---'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{item.durationMinutes} phút</span>
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {item.correctCount}/{item.totalQuestions}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-base font-black px-3 py-1 rounded-xl ${
                          item.score >= 8.0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : item.score >= 5.0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {item.score.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {item.tabSwitches > 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 text-[10px] font-bold">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{item.tabSwitches} lần chuyển tab</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Chuẩn mực
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => requestAllowRetake(item)}
                          className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/80 rounded-xl transition-colors font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Cho phép học sinh làm lại bài thi"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Làm lại</span>
                        </button>
                        <button
                          onClick={() => setDetailModalItem(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors cursor-pointer"
                          title="Xem chi tiết nhật ký thi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => requestDeleteResult(item)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                          title="Xóa kết quả"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Activity Detail Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Chi Tiết Bài Làm - {detailModalItem.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Lớp {detailModalItem.studentClass} | Mã đề: {detailModalItem.examCode}
                </p>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Điểm Số</span>
                <div className="text-xl font-black text-teal-600 dark:text-teal-400">
                  {detailModalItem.score.toFixed(2)}/10
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Thời Gian Làm</span>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {detailModalItem.durationMinutes} phút
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Chuyển Tab</span>
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {detailModalItem.tabSwitches} lần
                </div>
              </div>
            </div>

            {/* Activity Log list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nhật ký hoạt động (Activity Log):
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
                {detailModalItem.activityLogs && detailModalItem.activityLogs.length > 0 ? (
                  detailModalItem.activityLogs.map((log, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start justify-between space-x-2"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.event}
                        </span>
                        {log.details && (
                          <p className="text-[11px] text-slate-500 font-sans mt-0.5">{log.details}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    Không ghi nhận hành vi bất thường.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailModalItem(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-2xl ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                }`}
              >
                {confirmModal.type === 'delete' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <RotateCcw className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Xác nhận thao tác quản lý bài thi</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeConfirmAction}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-colors shadow-xs cursor-pointer ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.type === 'delete' ? 'Xác nhận Xóa' : 'Đồng ý Cho Làm Lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
                : 'bg-rose-950 text-rose-200 border-rose-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
