import React from 'react';
import { motion } from 'motion/react';
import Chart from 'react-apexcharts';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Grid,
  Layers,
  PlusCircle,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
  Award,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { ExamPackage, QuestionBankItem } from '../types';

interface DashboardViewProps {
  examHistory: ExamPackage[];
  questionBank: QuestionBankItem[];
  onSelectExamPackage: (examPack: ExamPackage) => void;
  onNavigateTab: (tab: any) => void;
  onDeleteExamPackage: (id: string) => void;
  onExportWord: (examPack: ExamPackage) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  examHistory,
  questionBank,
  onSelectExamPackage,
  onNavigateTab,
  onDeleteExamPackage,
  onExportWord,
}) => {
  const [deletingItem, setDeletingItem] = React.useState<ExamPackage | null>(null);
  const latestExam = examHistory[0] || null;

  // ApexCharts Configurations
  const trendChartOptions: any = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'Be Vietnam Pro, sans-serif',
      sparkline: { enabled: false },
    },
    colors: ['#10B981', '#06B6D4'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    stroke: { curve: 'smooth', width: 3 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7'],
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'Be Vietnam Pro' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'Be Vietnam Pro' } },
    },
    grid: { borderColor: 'rgba(148, 163, 184, 0.1)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' },
  };

  const trendSeries = [
    { name: 'Gói đề đã sinh', data: [12, 24, 38, 52, 68, examHistory.length || 85] },
    { name: 'Lượt học sinh nộp bài', data: [120, 280, 450, 820, 1150, 1480] },
  ];

  const cognitiveDonutOptions: any = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'Be Vietnam Pro, sans-serif',
    },
    labels: ['Nhận biết (40%)', 'Thông hiểu (30%)', 'Vận dụng (20%)', 'Vận dụng cao (10%)'],
    colors: ['#10B981', '#06B6D4', '#6366F1', '#F59E0B'],
    legend: {
      position: 'bottom',
      labels: { colors: '#94a3b8' },
      fontFamily: 'Be Vietnam Pro',
      fontSize: '12px',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Tổng Tỷ Lệ',
              color: '#94a3b8',
              formatter: () => '100% CV 7991',
            },
          },
        },
      },
    },
    stroke: { width: 0 },
    tooltip: { theme: 'dark' },
  };

  const cognitiveDonutSeries = [40, 30, 20, 10];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Hero Glassmorphic Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-10 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950 text-white border border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.15)]"
      >
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>VisionOS AI Dashboard • Công Văn 7991/BGDĐT</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent leading-tight">
              AI Test Generator Pro
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
              Khởi tạo Ma trận, Bảng đặc tả YCCĐ, Mã đề hoán vị và Rubric chấm tự động bám sát ma trận chuẩn cho giáo viên THCS & THPT toàn quốc.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('generator')}
              className="btn-glow-emerald px-7 py-4 rounded-2xl text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-emerald-200" />
              <span>Tạo Đề Thi Mới với AI</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Đề Thi Đã Sinh
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {examHistory.length} gói đề
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Chuẩn CV 7991/BGDĐT
            </p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ngân Hàng Câu Hỏi
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {questionBank.length} câu
            </h3>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold mt-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Sẵn sàng tái sử dụng
            </p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Khối Lớp Hỗ Trợ
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Khối 6 - 12
            </h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-1 flex items-center gap-1">
              <Grid className="w-3.5 h-3.5" /> THCS & THPT Toàn quốc
            </p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chất Lượng Đáp Án
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              100% Khắc Phục
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hiện lời giải ngay
            </p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* ApexCharts Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Xu Hướng Sinh Đề & Học Sinh Luyện Thi Online
                </h3>
                <p className="text-xs text-slate-500">Thống kê dữ liệu hoạt động theo thời gian thực</p>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Chart options={trendChartOptions} series={trendSeries} type="area" height={260} />
          </div>
        </div>

        {/* Cognitive Level Donut Chart */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Tỷ Lệ Nhận Thức CV 7991
              </h3>
              <p className="text-xs text-slate-500">Chuẩn khung năng lực Bộ GD&ĐT</p>
            </div>
          </div>
          <div className="pt-2 flex justify-center">
            <Chart options={cognitiveDonutOptions} series={cognitiveDonutSeries} type="donut" height={260} />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigateTab('generator')}
          className="glass-card p-6 cursor-pointer group hover:border-emerald-500/50"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-between">
            <span>Tạo Đề Mới với AI</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Nhập chủ đề, tinh chỉnh nút (+)(-) cấp độ nhận thức để Gemini AI sinh ma trận và đề thi tức thì.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigateTab('bank')}
          className="glass-card p-6 cursor-pointer group hover:border-cyan-500/50"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-between">
            <span>Ngân Hàng Câu Hỏi</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Quản lý, tìm kiếm, lưu trữ và xuất câu hỏi ra Excel để xây dựng kho tư liệu lâu dài.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => {
            if (latestExam) onSelectExamPackage(latestExam);
            onNavigateTab('matrix');
          }}
          className="glass-card p-6 cursor-pointer group hover:border-indigo-500/50"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center justify-between">
            <span>Ma Trận & Đặc Tả</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Xem và xuất trực tiếp bảng khung ma trận và đặc tả YCCĐ chuẩn Công văn 7991.
          </p>
        </motion.div>
      </div>

      {/* History Table Glass Container */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Lịch Sử Gói Đề Thi Đã Sinh
            </h3>
          </div>
        </div>

        {examHistory.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Chưa có đề kiểm tra nào trong lịch sử
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Nhấn nút "Tạo Đề Thi Mới với AI" để sinh gói đề thi đầy đủ Ma trận & Đáp án.
            </p>
            <button
              onClick={() => onNavigateTab('generator')}
              className="mt-4 btn-glow-emerald px-6 py-2.5 rounded-2xl text-white font-black text-xs cursor-pointer shadow-md"
            >
              + Tạo Đề Thi Ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800/80 uppercase text-[10px] font-black text-slate-400 bg-slate-100/50 dark:bg-slate-800/30">
                  <th className="p-3.5 rounded-l-2xl">Môn học / Khối</th>
                  <th className="p-3.5">Tên bài / Chương</th>
                  <th className="p-3.5">Số mã đề</th>
                  <th className="p-3.5">Thời gian khởi tạo</th>
                  <th className="p-3.5 text-right rounded-r-2xl">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {examHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>{item.metadata.subject} - {item.metadata.grade}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{item.metadata.curriculum}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      <div className="font-bold line-clamp-1">{item.metadata.examTitle}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{item.metadata.chapterTitle}</div>
                    </td>
                    <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400">
                      {item.exams.length} mã đề
                    </td>
                    <td className="p-3.5 text-slate-400 font-medium">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          onSelectExamPackage(item);
                          onNavigateTab('multicode');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Xem Đề
                      </button>
                      <button
                        onClick={() => onExportWord(item)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs transition-colors cursor-pointer"
                        title="Xuất Word"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Xác Nhận Xóa Đề Thi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bạn có chắc chắn muốn xóa gói đề thi <strong className="text-rose-600 dark:text-rose-400">{deletingItem.metadata.examTitle}</strong> khỏi lịch sử không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteExamPackage(deletingItem.id);
                  setDeletingItem(null);
                }}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Xóa Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
