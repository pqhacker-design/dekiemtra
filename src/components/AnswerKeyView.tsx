import React, { useState } from 'react';
import { CheckSquare, Download, FileText, Printer, CheckCircle, HelpCircle, AlignLeft, BookOpen } from 'lucide-react';
import { ExamPackage, getCognitiveTag, getCognitiveLabel } from '../types';
import { MathText } from './MathText';

interface AnswerKeyViewProps {
  examPackage: ExamPackage | null;
  onExportWord?: (mode?: 'full' | 'exams' | 'answers') => void;
  onExportPdf?: (code?: string) => void;
}

export const AnswerKeyView: React.FC<AnswerKeyViewProps> = ({
  examPackage,
  onExportWord,
  onExportPdf,
}) => {
  if (!examPackage) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <CheckSquare className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Chưa Có Dữ Liệu Đáp Án Vấn Đáp
        </h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Vui lòng vào mục "Tạo đề kiểm tra" để hệ thống AI sinh Đề thi và Đáp án chuẩn Công văn 7991/BGDĐT.
        </p>
      </div>
    );
  }

  const { metadata, answerKeys, exams } = examPackage;
  const [selectedCodeIndex, setSelectedCodeIndex] = useState(0);
  const currentAK = answerKeys[selectedCodeIndex] || answerKeys[0];
  const currentExam = exams.find((e) => e.code === currentAK.code) || exams[selectedCodeIndex] || exams[0];

  // Helper function to find a question in currentExam by question number
  const findQuestion = (qNum: number) => {
    return currentExam?.questions.find((q) => q.number === qNum);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Đáp Án & Hướng Dẫn Chấm Môn {metadata.subject} ({metadata.grade})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
              Mã đề: {currentAK.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân chia rõ ràng từng phần (I, II, III, IV) bám sát cấu trúc Công văn 7991/BGDĐT.
          </p>
        </div>

        {/* Code Selector & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {answerKeys.length > 1 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <span className="text-xs font-semibold px-2 text-slate-500">Mã đề:</span>
              {answerKeys.map((ak, idx) => (
                <button
                  key={ak.code}
                  onClick={() => setSelectedCodeIndex(idx)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedCodeIndex === idx
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {ak.code}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-2">
            {onExportWord && (
              <button
                onClick={() => onExportWord('answers')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                title="Tải riêng file Word chứa Đáp án và Hướng dẫn chấm"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Đáp Án Word (.docx)</span>
              </button>
            )}

            {onExportPdf && (
              <button
                onClick={() => onExportPdf(currentAK.code)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                title="Xuất file PDF hoặc In trực tiếp Đáp án & Hướng dẫn chấm"
              >
                <Printer className="w-4 h-4" />
                <span>Xuất Đáp Án PDF</span>
              </button>
            )}

            {onExportWord && (
              <button
                onClick={() => onExportWord('full')}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                title="Xuất file Word bao gồm cả Ma trận, Đặc tả, Đề thi và Đáp án"
              >
                <span>Xuất Trọn Gói Word</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Answer Key Main Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-8">
        
        {/* Header Title */}
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-xl md:text-2xl font-black uppercase text-teal-800 dark:text-teal-300">
            ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM BÀI - MÃ ĐỀ {currentAK.code}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Môn {metadata.subject} - Lớp {metadata.grade} | Năm học {metadata.schoolYear}
          </p>
        </div>

        {/* 1. PHẦN I: Trắc nghiệm Nhiều lựa chọn */}
        {currentAK.part1Answers.length > 0 && (
          <div className="p-5 rounded-2xl border-2 border-teal-500/30 bg-teal-50/30 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-base text-teal-900 dark:text-teal-300 uppercase flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-teal-600" />
                <span>PHẦN I. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN</span>
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                Mỗi câu trả lời đúng được điểm theo quy định
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse border border-teal-300 dark:border-slate-700">
                <thead>
                  <tr className="bg-teal-800 text-white font-bold">
                    {currentAK.part1Answers.map((ans) => {
                      const q = findQuestion(ans.questionNumber);
                      const tag = q ? getCognitiveTag(q.cognitiveLevel, q.partType) : '';
                      return (
                        <th key={ans.questionNumber} className="border border-teal-600 p-2 min-w-[50px]">
                          <div>Câu {ans.questionNumber}</div>
                          {tag && <div className="text-[10px] text-amber-300 font-extrabold">{tag}</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-extrabold text-base text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900">
                    {currentAK.part1Answers.map((ans) => (
                      <td key={ans.questionNumber} className="border border-teal-200 dark:border-slate-700 p-3">
                        {ans.correctOption}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. PHẦN II: Trắc nghiệm Đúng / Sai */}
        {currentAK.part2Answers.length > 0 && (
          <div className="p-5 rounded-2xl border-2 border-indigo-500/30 bg-indigo-50/30 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-base text-indigo-900 dark:text-indigo-300 uppercase flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <span>PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI</span>
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                Đúng 1 ý: 0.1đ | 2 ý: 0.25đ | 3 ý: 0.5đ | 4 ý: 1.0đ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentAK.part2Answers.map((ans) => {
                const q = findQuestion(ans.questionNumber);
                const tag = q ? getCognitiveTag(q.cognitiveLevel) : '';
                return (
                  <div
                    key={ans.questionNumber}
                    className="p-4 rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
                      <span>
                        Câu {ans.questionNumber}{' '}
                        {tag && <span className="text-amber-600 dark:text-amber-400 text-xs font-extrabold mr-1">{tag}</span>}
                        ({ans.points} điểm):
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      {ans.statements.map((s) => (
                        <div
                          key={s.key}
                          className={`p-2 rounded-lg border flex items-center justify-between ${
                            s.isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          <span>Ý {s.key})</span>
                          <span className="font-black">{s.isCorrect ? 'ĐÚNG' : 'SAI'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. PHẦN III: Trắc nghiệm Trả lời ngắn */}
        {currentAK.part3Answers.length > 0 && (
          <div className="p-5 rounded-2xl border-2 border-amber-500/30 bg-amber-50/30 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-base text-amber-900 dark:text-amber-300 uppercase flex items-center space-x-2">
                <AlignLeft className="w-5 h-5 text-amber-600" />
                <span>PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN</span>
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                Thí sinh điền kết quả ngắn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentAK.part3Answers.map((ans) => {
                const q = findQuestion(ans.questionNumber);
                const tag = q ? getCognitiveTag(q.cognitiveLevel) : '';
                return (
                  <div
                    key={ans.questionNumber}
                    className="p-3.5 rounded-xl border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs"
                  >
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Câu {ans.questionNumber}{' '}
                      {tag && <span className="text-amber-600 dark:text-amber-400 font-extrabold">{tag}</span>}:
                    </span>
                    <span className="font-black text-sm text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                      <MathText content={ans.shortAnswer} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. PHẦN IV: Tự luận & Rubric chấm bài */}
        {currentAK.part4Answers.length > 0 && (
          <div className="p-5 rounded-2xl border-2 border-purple-500/30 bg-purple-50/30 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-200 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-base text-purple-900 dark:text-purple-300 uppercase flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span>PHẦN IV. HƯỚNG DẪN CHẤM TỰ LUẬN & RUBRIC ĐÁNH GIÁ</span>
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300">
                Thang điểm & Hướng dẫn chấm chi tiết
              </span>
            </div>

            <div className="space-y-4">
              {currentAK.part4Answers.map((ans) => {
                const q = findQuestion(ans.questionNumber);
                const tag = q ? getCognitiveTag(q.cognitiveLevel) : '';
                const levelLabel = q ? getCognitiveLabel(q.cognitiveLevel) : '';

                return (
                  <div
                    key={ans.questionNumber}
                    className="p-5 rounded-2xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>Câu {ans.questionNumber} ({ans.points} điểm)</span>
                        {tag && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {tag} - {levelLabel}
                          </span>
                        )}
                      </h4>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
                      <div className="font-semibold text-teal-800 dark:text-teal-300">Hướng dẫn giải chi tiết:</div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-sans whitespace-pre-wrap">
                        <MathText content={ans.essayAnswerGuide} />
                      </div>
                    </div>

                    {/* Rubric table */}
                    {ans.rubric && ans.rubric.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                          Rubric / Khung Tiêu Chí Chấm Điểm Chi Tiết:
                        </div>
                        <table className="w-full text-xs text-left border-collapse border border-slate-300 dark:border-slate-700">
                          <thead>
                            <tr className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold">
                              <th className="border border-slate-300 dark:border-slate-700 p-2">Bước / Tiêu chí</th>
                              <th className="border border-slate-300 dark:border-slate-700 p-2 w-20 text-center">Điểm</th>
                              <th className="border border-slate-300 dark:border-slate-700 p-2">Mô tả yêu cầu đạt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ans.rubric.map((r, idx) => (
                              <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-800/60">
                                <td className="border border-slate-300 dark:border-slate-700 p-2 font-semibold">{r.criteria}</td>
                                <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold text-teal-700 dark:text-teal-400">{r.points} đ</td>
                                <td className="border border-slate-300 dark:border-slate-700 p-2">{r.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
