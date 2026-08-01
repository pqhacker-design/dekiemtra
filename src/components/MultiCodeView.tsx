import React, { useState } from 'react';
import { Copy, Download, FileSpreadsheet, Eye, Printer, CheckCircle2, Lightbulb } from 'lucide-react';
import { ExamPackage } from '../types';
import { QuestionDetailCard } from './QuestionDetailCard';

interface MultiCodeViewProps {
  examPackage: ExamPackage | null;
  onExportWord?: () => void;
  onExportPdf?: (code?: string) => void;
  onExportExcel?: () => void;
}

export const MultiCodeView: React.FC<MultiCodeViewProps> = ({
  examPackage,
  onExportWord,
  onExportPdf,
  onExportExcel,
}) => {
  if (!examPackage) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Copy className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Chưa Có Dữ Liệu Mã Đề Kiểm Tra
        </h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Vui lòng vào mục "Tạo đề kiểm tra" để hệ thống AI sinh danh sách nhiều mã đề xáo trộn (101, 102, 103...).
        </p>
      </div>
    );
  }

  const { metadata, exams, answerKeys } = examPackage;
  const [activeCodeTab, setActiveCodeTab] = useState<string>(exams[0]?.code || '101');

  // Preview toggles for viewing details & answers
  const [showAnswersInPreview, setShowAnswersInPreview] = useState(true);
  const [showExplanationsInPreview, setShowExplanationsInPreview] = useState(true);

  const selectedExam = exams.find((e) => e.code === activeCodeTab) || exams[0];
  const selectedAK = answerKeys.find((ak) => ak.code === activeCodeTab) || answerKeys[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-900/50 px-2.5 py-0.5 rounded-full text-xs font-bold text-teal-800 dark:text-teal-300">
            <span>SINH NHIỀU MÃ ĐỀ TỰ ĐỘNG</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Quản Lý {exams.length} Mã Đề Đã Xáo Trộn - Môn {metadata.subject} ({metadata.grade})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đã xáo trộn thứ tự câu hỏi và vị trí phương án A, B, C, D nhưng đảm bảo giữ nguyên ma trận độ khó.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onExportWord && (
            <button
              onClick={onExportWord}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Tất Cả Word (.docx)</span>
            </button>
          )}

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Bảng Đáp Án Excel</span>
            </button>
          )}

          {onExportPdf && (
            <button
              onClick={() => onExportPdf()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In / PDF Tất Cả</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Tab Switcher */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {exams.map((ex) => (
          <button
            key={ex.code}
            onClick={() => setActiveCodeTab(ex.code)}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
              activeCodeTab === ex.code
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Mã Đề {ex.code}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-white font-normal">
              {ex.questions.length} câu
            </span>
          </button>
        ))}
      </div>

      {/* Active Code Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Question Order & Full Content Preview */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <Eye className="w-5 h-5 text-teal-600" />
              <span>Chi Tiết Đề Thi & Phương Án - Mã Đề {selectedExam.code}</span>
            </h3>

            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAnswersInPreview(!showAnswersInPreview)}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center space-x-1 cursor-pointer ${
                  showAnswersInPreview
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{showAnswersInPreview ? 'Đã hiện Đáp án' : 'Ẩn Đáp án'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExplanationsInPreview(!showExplanationsInPreview)}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center space-x-1 cursor-pointer ${
                  showExplanationsInPreview
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showExplanationsInPreview ? 'Đã hiện Lời giải' : 'Ẩn Lời giải'}</span>
              </button>

              {onExportPdf && (
                <button
                  onClick={() => onExportPdf(selectedExam.code)}
                  className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
                >
                  In Mã Đề {selectedExam.code}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
            {selectedExam.questions.map((q, idx) => (
              <QuestionDetailCard
                key={q.id || `q_${idx}`}
                question={q}
                questionNumber={q.number || idx + 1}
                showAnswers={showAnswersInPreview}
                showExplanation={showExplanationsInPreview}
                defaultExpandedExplanation={showExplanationsInPreview}
              />
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quick Answer Key Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 h-fit">
          <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Bảng Đáp Án Nhanh - Mã Đề {selectedAK.code}
          </h3>

          <div className="space-y-4">
            {/* Part I Answers */}
            {selectedAK.part1Answers.length > 0 && (
              <div>
                <h4 className="font-bold text-xs text-teal-700 dark:text-teal-400 mb-2">
                  Phần I: Trắc nghiệm 4 phương án
                </h4>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-bold">
                  {selectedAK.part1Answers.map((ans) => (
                    <div
                      key={ans.questionNumber}
                      className="p-2 rounded-lg bg-teal-50 dark:bg-slate-800 border border-teal-200 dark:border-slate-700"
                    >
                      <div className="text-[10px] text-slate-500">C{ans.questionNumber}</div>
                      <div className="text-sm font-extrabold text-teal-700 dark:text-teal-300">
                        {ans.correctOption}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Part II Answers */}
            {selectedAK.part2Answers.length > 0 && (
              <div>
                <h4 className="font-bold text-xs text-teal-700 dark:text-teal-400 mb-2">
                  Phần II: Đúng / Sai
                </h4>
                <div className="space-y-1.5 text-xs">
                  {selectedAK.part2Answers.map((ans) => (
                    <div
                      key={ans.questionNumber}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="font-bold">Câu {ans.questionNumber}:</span>
                      <span className="font-bold text-teal-600">
                        {ans.statements.map((s) => `${s.key}:${s.isCorrect ? 'Đ' : 'S'}`).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Part III Answers */}
            {selectedAK.part3Answers.length > 0 && (
              <div>
                <h4 className="font-bold text-xs text-teal-700 dark:text-teal-400 mb-2">
                  Phần III: Trả lời ngắn
                </h4>
                <div className="space-y-1 text-xs">
                  {selectedAK.part3Answers.map((ans) => (
                    <div
                      key={ans.questionNumber}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="font-bold">Câu {ans.questionNumber}:</span>
                      <span className="font-bold text-emerald-700 dark:text-teal-300 font-mono">
                        {ans.shortAnswer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
