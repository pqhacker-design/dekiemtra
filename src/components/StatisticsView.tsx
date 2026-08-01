import React from 'react';
import { BarChart3, PieChart, TrendingUp, CheckCircle } from 'lucide-react';
import { ExamPackage, QuestionBankItem } from '../types';

interface StatisticsViewProps {
  examHistory: ExamPackage[];
  questionBank: QuestionBankItem[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  examHistory,
  questionBank,
}) => {
  // Statistics calculations
  const totalExamsGenerated = examHistory.length;
  const totalQuestionsInExams = examHistory.reduce(
    (acc, pack) => acc + (pack.exams[0]?.questions.length || 0),
    0
  );

  // Subject distribution
  const subjectMap: Record<string, number> = {};
  examHistory.forEach((item) => {
    const sub = item.metadata.subject;
    subjectMap[sub] = (subjectMap[sub] || 0) + 1;
  });

  // Cognitive distribution in Bank
  const cognitiveMap: Record<string, number> = {
    'NHẬN BIẾT': 0,
    'THÔNG HIỂU': 0,
    'VẬN DỤNG': 0,
    'VẬN DỤNG CAO': 0,
  };
  questionBank.forEach((q) => {
    const lvl = q.question.cognitiveLevel;
    if (cognitiveMap[lvl] !== undefined) {
      cognitiveMap[lvl]++;
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-900/50 px-2.5 py-0.5 rounded-full text-xs font-bold text-teal-800 dark:text-teal-300">
          <span>THỐNG KÊ NĂNG LỰC ĐÁNH GIÁ</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
          Báo Cáo Thống Kê & Phân Tích Độ Khó Đề Kiểm Tra
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi tổng quan dữ liệu đề kiểm tra, tỷ lệ phân bổ mức độ nhận thức và ngân hàng câu hỏi.
        </p>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <p className="text-xs font-bold text-slate-500">Tổng gói đề thi đã tạo</p>
          <div className="text-3xl font-black text-teal-600 dark:text-teal-400">
            {totalExamsGenerated} gói
          </div>
          <p className="text-[11px] text-slate-400">Gồm đầy đủ Ma trận, Bảng đặc tả, Đề & Đáp án</p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <p className="text-xs font-bold text-slate-500">Tổng số câu hỏi được khởi tạo</p>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {totalQuestionsInExams} câu
          </div>
          <p className="text-[11px] text-slate-400">Phủ khắp các mức độ Nhận biết - Vận dụng cao</p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <p className="text-xs font-bold text-slate-500">Kho lưu trữ ngân hàng</p>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {questionBank.length} câu
          </div>
          <p className="text-[11px] text-slate-400">Lưu trong LocalStorage trình duyệt</p>
        </div>
      </div>

      {/* Charts / Distribution Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2 border-b pb-3">
            <PieChart className="w-5 h-5 text-teal-600" />
            <span>Phân Bổ Theo Môn Học</span>
          </h3>

          <div className="space-y-3">
            {Object.keys(subjectMap).length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có dữ liệu môn học.</p>
            ) : (
              Object.entries(subjectMap).map(([sub, count]) => {
                const percent = Math.round((count / totalExamsGenerated) * 100);
                return (
                  <div key={sub} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{sub}</span>
                      <span className="text-teal-600">{count} đề ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cognitive Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2 border-b pb-3">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <span>Thống Kê Ngân Hàng Theo Mức Độ</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(cognitiveMap).map(([lvl, count]) => {
              const totalQ = questionBank.length || 1;
              const percent = Math.round((count / totalQ) * 100);
              return (
                <div key={lvl} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{lvl}</span>
                    <span className="text-indigo-600">{count} câu ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
