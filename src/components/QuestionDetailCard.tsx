import React, { useState } from 'react';
import { Check, CheckCircle2, CheckSquare, ChevronDown, ChevronUp, HelpCircle, Lightbulb, Square, XCircle } from 'lucide-react';
import { Question, QuestionBankItem, getCognitiveTag, getCognitiveLabel } from '../types';
import { MathText } from './MathText';

interface QuestionDetailCardProps {
  question: Question | QuestionBankItem;
  questionNumber?: number;
  showAnswers?: boolean;
  showExplanation?: boolean;
  defaultExpandedExplanation?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  badgeExtra?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  isCompact?: boolean;
}

export const QuestionDetailCard: React.FC<QuestionDetailCardProps> = ({
  question,
  questionNumber,
  showAnswers = true,
  showExplanation = true,
  defaultExpandedExplanation = false,
  selectable = false,
  isSelected = false,
  onToggleSelect,
  badgeExtra,
  actions,
  className = '',
  isCompact = false,
}) => {
  const [expandExplanation, setExpandExplanation] = useState(defaultExpandedExplanation);

  const num = questionNumber || (question as Question).number || 1;
  const partType = question.partType || 'PART1';
  const points = question.points || 0.25;

  const cognitiveTag = getCognitiveTag(question.cognitiveLevel, partType);
  const cognitiveLabel = getCognitiveLabel(question.cognitiveLevel);

  // Correct Answer Key detection for PART1
  const correctOpt = question.correctOption || (question as any).correctAnswer || 'A';

  // True / False statements for PART2
  const trueFalseList = question.trueFalseStatements || (question as any).statements || [];

  // Short answer for PART3
  const shortAns = question.shortAnswer || (question as any).correctAnswer || '';

  // Essay guide for PART4
  const essayGuide = question.essayAnswerGuide || (question as any).explanation || '';

  // Explanation
  const explanation = question.explanation || (question as any).solution || '';

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isSelected
          ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 shadow-md ring-2 ring-teal-500/20'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      } ${className}`}
    >
      <div className="p-4 md:p-5 space-y-3">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {selectable && (
              <button
                type="button"
                onClick={onToggleSelect}
                className="mr-1 text-teal-600 dark:text-teal-400 hover:scale-110 transition-transform cursor-pointer"
              >
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                )}
              </button>
            )}

            <span className="font-black text-sm md:text-base text-teal-700 dark:text-teal-400">
              Câu {num}
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {partType === 'PART1'
                ? 'Phần I: TN 4 Lựa chọn'
                : partType === 'PART2'
                ? 'Phần II: TN Đúng/Sai'
                : partType === 'PART3'
                ? 'Phần III: Trả lời ngắn'
                : 'Phần IV: Tự luận'}
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {cognitiveTag} - {cognitiveLabel}
            </span>

            <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
              {points} điểm
            </span>

            {badgeExtra}
          </div>

          {actions && <div className="flex items-center space-x-1 shrink-0">{actions}</div>}
        </div>

        {/* Question Text Content */}
        <div className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
          <MathText content={question.content} />
        </div>

        {/* SVG Diagram if present */}
        {question.svgDiagram && (
          <div
            className="p-3 my-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto flex justify-center"
            dangerouslySetInnerHTML={{ __html: question.svgDiagram }}
          />
        )}

        {/* PART I OPTIONS */}
        {partType === 'PART1' && question.options && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs md:text-sm">
            {question.options.map((opt) => {
              const isCorrectOpt = showAnswers && opt.key === correctOpt;
              return (
                <div
                  key={opt.key}
                  className={`p-2.5 rounded-xl border transition-all flex items-start space-x-2 ${
                    isCorrectOpt
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span
                    className={`font-black shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                      isCorrectOpt
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <div className="flex-1 pt-0.5">
                    <MathText content={opt.content} />
                  </div>
                  {isCorrectOpt && (
                    <span className="shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Đáp án đúng</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PART II STATEMENTS */}
        {partType === 'PART2' && trueFalseList.length > 0 && (
          <div className="space-y-2 pt-1 text-xs md:text-sm">
            <div className="text-[11px] font-bold text-slate-500 italic">
              Xét tính đúng / sai của các mệnh đề sau:
            </div>
            {trueFalseList.map((st: any) => {
              const isTrue = st.isCorrect !== undefined ? st.isCorrect : st.isTrue;
              return (
                <div
                  key={st.key}
                  className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start space-x-2 flex-1">
                    <span className="font-black text-slate-700 dark:text-slate-300 uppercase shrink-0">
                      {st.key})
                    </span>
                    <div className="flex-1 text-slate-800 dark:text-slate-200 font-medium">
                      <MathText content={st.content} />
                    </div>
                  </div>

                  {showAnswers && isTrue !== undefined && (
                    <span
                      className={`shrink-0 text-xs font-black px-2.5 py-1 rounded-lg flex items-center space-x-1 ${
                        isTrue
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {isTrue ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{isTrue ? 'Mệnh đề ĐÚNG' : 'Mệnh đề SAI'}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PART III SHORT ANSWER */}
        {partType === 'PART3' && (
          <div className="pt-1">
            {showAnswers && shortAns ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-800 flex items-center space-x-2 text-xs md:text-sm text-emerald-950 dark:text-emerald-200">
                <span className="font-extrabold text-emerald-700 dark:text-teal-400 shrink-0">
                  Đáp án ngắn:
                </span>
                <span className="font-black font-mono text-sm bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
                  <MathText content={shortAns} />
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 italic">
                Thí sinh điền kết quả vào ô trả lời ngắn.
              </div>
            )}
          </div>
        )}

        {/* PART IV ESSAY GUIDE */}
        {partType === 'PART4' && (
          <div className="pt-1 space-y-2">
            {showAnswers && essayGuide ? (
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 space-y-1.5 text-xs md:text-sm">
                <div className="font-extrabold text-teal-800 dark:text-teal-300 flex items-center space-x-1">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Hướng dẫn chấm & Đáp án tự luận:</span>
                </div>
                <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  <MathText content={essayGuide} />
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 italic">
                Thí sinh trình bày chi tiết lời giải vào giấy thi.
              </div>
            )}
          </div>
        )}

        {/* EXPLANATION / LỜI GIẢI CHI TIẾT */}
        {showExplanation && explanation && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setExpandExplanation(!expandExplanation)}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 flex items-center space-x-1.5 py-1 cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>{expandExplanation ? 'Thu gọn Lời giải chi tiết' : 'Xem Lời giải chi tiết & Hướng dẫn'}</span>
              {expandExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandExplanation && (
              <div className="mt-2 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs md:text-sm text-slate-800 dark:text-slate-200">
                <div className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center space-x-1">
                  <span>Lời giải chi tiết:</span>
                </div>
                <div className="leading-relaxed font-medium">
                  <MathText content={explanation} />
                </div>
                {question.solutionDiagramSvg && (
                  <div
                    className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 flex justify-center overflow-x-auto mt-2"
                    dangerouslySetInnerHTML={{ __html: question.solutionDiagramSvg }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
