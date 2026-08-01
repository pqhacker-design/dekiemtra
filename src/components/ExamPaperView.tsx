import React, { useState } from 'react';
import { CheckCircle2, Download, Edit2, FileText, Printer, Save } from 'lucide-react';
import { ExamPackage, Question, getCognitiveTag, getCognitiveLabel } from '../types';
import { MathText } from './MathText';
import { DiagramEngine } from '../services/diagramEngine';

interface ExamPaperViewProps {
  examPackage: ExamPackage | null;
  onExportWord?: () => void;
  onExportPdf?: (code?: string) => void;
  onUpdateQuestion?: (code: string, question: Question) => void;
}

export const ExamPaperView: React.FC<ExamPaperViewProps> = ({
  examPackage,
  onExportWord,
  onExportPdf,
  onUpdateQuestion,
}) => {
  if (!examPackage) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <FileText className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Chưa Có Dữ Liệu Đề Kiểm Tra
        </h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Vui lòng vào mục "Tạo đề kiểm tra" để hệ thống AI sinh các mã đề kiểm tra bám sát Công văn 7991/BGDĐT.
        </p>
      </div>
    );
  }

  const { metadata, exams } = examPackage;
  const [selectedCodeIndex, setSelectedCodeIndex] = useState(0);
  const currentExam = exams[selectedCodeIndex] || exams[0];

  const [showAnswersInPaper, setShowAnswersInPaper] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionContent, setEditQuestionContent] = useState('');

  const handleStartEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setEditQuestionContent(q.content);
  };

  const handleSaveEdit = (q: Question) => {
    if (onUpdateQuestion) {
      onUpdateQuestion(currentExam.code, { ...q, content: editQuestionContent });
    }
    setEditingQuestionId(null);
  };

  const getPartHeaderInfo = (partType: string) => {
    switch (partType) {
      case 'PART1':
        return {
          title: 'PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN',
          desc: 'Thí sinh chọn 1 phương án trả lời đúng nhất trong các câu hỏi dưới đây.',
        };
      case 'PART2':
        return {
          title: 'PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG / SAI',
          desc: 'Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai.',
        };
      case 'PART3':
        return {
          title: 'PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN',
          desc: 'Thí sinh điền kết quả tính toán hoặc đáp án ngắn gọn.',
        };
      case 'PART4':
        return {
          title: 'PHẦN IV. CÂU HỎI TỰ LUẬN',
          desc: 'Thí sinh trình bày chi tiết lời giải và các bước tính toán.',
        };
      default:
        return { title: '', desc: '' };
    }
  };

  let lastPartType = '';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Đề Kiểm Tra Môn {metadata.subject} ({metadata.grade})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
              Mã đề: {currentExam.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Thời gian: {metadata.durationMinutes} phút | Thang điểm: {metadata.totalPoints} | Tổng số câu: {currentExam.questions.length} câu
          </p>
        </div>

        {/* Code Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {exams.length > 1 && (
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <span className="text-xs font-semibold px-2 text-slate-500">Mã đề:</span>
              {exams.map((ex, idx) => (
                <button
                  key={ex.code}
                  onClick={() => setSelectedCodeIndex(idx)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedCodeIndex === idx
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {ex.code}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAnswersInPaper(!showAnswersInPaper)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              showAnswersInPaper
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{showAnswersInPaper ? 'Đang hiện Đáp án' : 'Hiện Đáp án & Lời giải'}</span>
          </button>

          {onExportPdf && (
            <button
              onClick={() => onExportPdf(currentExam.code)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>In / PDF</span>
            </button>
          )}

          {onExportWord && (
            <button
              onClick={onExportWord}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Word (.docx)</span>
            </button>
          )}
        </div>
      </div>

      {/* Standard Exam Paper Paper Sheet Layout */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-8 md:p-12 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-serif leading-relaxed">
        {/* Header Administrative */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-slate-900 dark:border-slate-100 text-center text-xs md:text-sm font-bold uppercase tracking-tight">
          <div>
            <div>{metadata.departmentName}</div>
            <div className="text-teal-700 dark:text-teal-400 font-extrabold">{metadata.schoolName}</div>
          </div>
          <div>
            <div>ĐỀ KIỂM TRA {metadata.examTitle}</div>
            <div>NĂM HỌC {metadata.schoolYear}</div>
          </div>
        </div>

        {/* Title & Badge */}
        <div className="text-center my-6 space-y-1">
          <div className="inline-block px-4 py-1 border-2 border-slate-900 dark:border-slate-100 font-black text-lg md:text-xl tracking-wider text-teal-800 dark:text-teal-300 mb-2">
            MÃ ĐỀ THI: {currentExam.code}
          </div>
          <h1 className="text-lg md:text-2xl font-black uppercase text-slate-900 dark:text-white">
            MÔN: {metadata.subject.toUpperCase()} - {metadata.grade.toUpperCase()}
          </h1>
          <p className="text-xs md:text-sm italic text-slate-600 dark:text-slate-400 font-sans">
            (Thời gian làm bài: {metadata.durationMinutes} phút - Không kể thời gian giao đề)
          </p>
        </div>

        {/* Questions Body */}
        <div className="space-y-6 mt-8 font-sans">
          {currentExam.questions.map((q) => {
            const isEditingThis = editingQuestionId === q.id;

            const isNewPart = q.partType !== lastPartType;
            if (isNewPart) {
              lastPartType = q.partType;
            }

            const headerInfo = getPartHeaderInfo(q.partType);
            const tag = getCognitiveTag(q.cognitiveLevel, q.partType);
            const levelLabel = getCognitiveLabel(q.cognitiveLevel);

            return (
              <React.Fragment key={q.id}>
                {isNewPart && (
                  <div className="pt-4 pb-1 mt-6 border-b-2 border-teal-700 dark:border-teal-500">
                    <h3 className="font-extrabold text-base text-teal-800 dark:text-teal-300 uppercase tracking-wide">
                      {headerInfo.title}
                    </h3>
                    <p className="text-xs italic text-slate-600 dark:text-slate-400">
                      ({headerInfo.desc})
                    </p>
                  </div>
                )}

                <div
                  className="p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800 group relative"
                >
                  {/* Question Header & Action */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex-1">
                      <span className="text-teal-700 dark:text-teal-400 font-black mr-1">
                        Câu {q.number} <span className="text-amber-600 dark:text-amber-400 font-extrabold">{tag}</span>
                        {q.partType === 'PART4' && q.points ? ` (${q.points} điểm)` : ''}:
                      </span>{' '}
                      {isEditingThis ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editQuestionContent}
                            onChange={(e) => setEditQuestionContent(e.target.value)}
                            className="w-full p-2 border border-teal-500 rounded-lg text-sm bg-white dark:bg-slate-800"
                            rows={3}
                          />
                          <button
                            onClick={() => handleSaveEdit(q)}
                            className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Lưu</span>
                          </button>
                        </div>
                      ) : (
                        <MathText content={q.content} />
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 shrink-0">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        {tag} - {levelLabel}
                      </span>
                      <button
                        onClick={() => handleStartEdit(q)}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                        title="Sửa nội dung câu hỏi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Phần I: 4 Lựa chọn A, B, C, D */}
                  {q.partType === 'PART1' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pl-4">
                      {q.options.map((opt) => {
                        const isCorrectOpt = showAnswersInPaper && opt.key === q.correctOption;
                        return (
                          <div
                            key={opt.key}
                            className={`text-sm flex items-start space-x-1.5 p-1.5 rounded-lg ${
                              isCorrectOpt
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 font-bold text-emerald-950 dark:text-emerald-100'
                                : ''
                            }`}
                          >
                            <span className="font-bold text-slate-900 dark:text-white">{opt.key}.</span>
                            <MathText content={opt.content} />
                            {isCorrectOpt && (
                              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 ml-auto bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded">
                                (Đáp án đúng)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Phần II: Đúng / Sai (ý a, b, c, d) */}
                  {q.partType === 'PART2' && q.trueFalseStatements && (
                    <div className="space-y-1.5 mt-3 pl-4 text-sm">
                      {q.trueFalseStatements.map((tf) => (
                        <div key={tf.key} className="flex items-start justify-between space-x-1.5 p-1 rounded-lg">
                          <div className="flex items-start space-x-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{tf.key})</span>
                            <MathText content={tf.content} />
                          </div>
                          {showAnswersInPaper && tf.isCorrect !== undefined && (
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded ${
                                tf.isCorrect
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                              }`}
                            >
                              {tf.isCorrect ? 'ĐÚNG' : 'SAI'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Phần III: Trả lời ngắn */}
                  {q.partType === 'PART3' && showAnswersInPaper && q.shortAnswer && (
                    <div className="mt-2 pl-4 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center space-x-2">
                      <span>Đáp án ngắn:</span>
                      <span className="font-mono text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-400">
                        <MathText content={q.shortAnswer} />
                      </span>
                    </div>
                  )}

                  {/* Phần IV: Tự luận */}
                  {q.partType === 'PART4' && showAnswersInPaper && q.essayAnswerGuide && (
                    <div className="mt-2 pl-4 text-xs text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-300 dark:border-teal-800 space-y-1">
                      <div className="font-bold text-teal-800 dark:text-teal-300">
                        Hướng dẫn chấm & Đáp án tự luận:
                      </div>
                      <MathText content={q.essayAnswerGuide} />
                    </div>
                  )}

                  {/* Lời giải chi tiết */}
                  {showAnswersInPaper && q.explanation && (
                    <div className="mt-3 pl-4 text-xs text-amber-950 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900 space-y-1">
                      <div className="font-extrabold text-amber-800 dark:text-amber-300">
                        Lời giải chi tiết:
                      </div>
                      <MathText content={q.explanation} />
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer End Mark */}
        <div className="text-center font-bold italic text-slate-500 mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
          --- HẾT MÃ ĐỀ {currentExam.code} (Cán bộ coi thi không giải thích gì thêm) ---
        </div>
      </div>
    </div>
  );
};
