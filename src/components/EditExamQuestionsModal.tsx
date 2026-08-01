import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckSquare,
  Clock,
  Edit3,
  HelpCircle,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import { OnlineExamService } from '../services/onlineExamService';
import { StorageEngine } from '../services/storageEngine';
import { MathText } from './MathText';

interface EditExamQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examCode: string;
  onSavedSuccess: () => void;
}

export const EditExamQuestionsModal: React.FC<EditExamQuestionsModalProps> = ({
  isOpen,
  onClose,
  examCode,
  onSavedSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [examDetail, setExamDetail] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [pointsMap, setPointsMap] = useState<Record<string | number, number>>({});

  useEffect(() => {
    if (!isOpen || !examCode) return;

    const fetchDetail = async () => {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const res = await OnlineExamService.getExamDetail(examCode);
        if (res.success && res.exam) {
          setExamDetail(res.exam);
          const qList = res.exam.examPackage?.exams?.[0]?.questions || [];
          setQuestions(qList);

          const initialMap: Record<string | number, number> = {};
          qList.forEach((q: any) => {
            const defaultPt =
              q.points !== undefined && q.points !== null
                ? Number(q.points)
                : q.partType === 'PART2'
                ? 1.0
                : q.partType === 'PART4'
                ? 1.0
                : 0.25;
            initialMap[q.id || q.number] = defaultPt;
          });
          setPointsMap(initialMap);
        } else {
          setErrorMsg('Không thể tải chi tiết đề thi.');
        }
      } catch (err: any) {
        setErrorMsg('Lỗi kết nối: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, examCode]);

  if (!isOpen) return null;

  const handlePointChange = (key: string | number, val: number) => {
    const validVal = Math.max(0.01, Math.min(10, Math.round(val * 100) / 100));
    setPointsMap((prev) => ({
      ...prev,
      [key]: validVal,
    }));
  };

  const currentTotalPoints = questions.reduce((acc, q) => {
    const key = q.id || q.number;
    return acc + (pointsMap[key] ?? 0.25);
  }, 0);

  const roundedTotalPoints = Math.round(currentTotalPoints * 100) / 100;

  // Preset point actions
  const applyPresetPart = (partType: string, points: number) => {
    setPointsMap((prev) => {
      const next = { ...prev };
      questions.forEach((q) => {
        if (q.partType === partType || (!q.partType && partType === 'PART1')) {
          next[q.id || q.number] = points;
        }
      });
      return next;
    });
  };

  const divideTenPointsEvenly = () => {
    if (questions.length === 0) return;
    const perQ = Math.round((10 / questions.length) * 100) / 100;
    setPointsMap((prev) => {
      const next = { ...prev };
      questions.forEach((q) => {
        next[q.id || q.number] = perQ;
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!examDetail) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Clone examPackage
      const updatedPackage = JSON.parse(JSON.stringify(examDetail.examPackage || {}));
      if (updatedPackage.exams && updatedPackage.exams[0]) {
        updatedPackage.exams[0].questions = updatedPackage.exams[0].questions.map((q: any) => {
          const key = q.id || q.number;
          const pt = pointsMap[key] !== undefined ? pointsMap[key] : (q.points || 0.25);
          return {
            ...q,
            points: pt,
          };
        });
      }

      // Update answer keys points
      if (updatedPackage.answerKeys && updatedPackage.answerKeys[0]) {
        const ak = updatedPackage.answerKeys[0];
        if (ak.part1Answers) {
          ak.part1Answers = ak.part1Answers.map((a: any) => {
            const matchingQ = updatedPackage.exams[0].questions.find((q: any) => q.number === a.questionNumber);
            return { ...a, points: matchingQ?.points || a.points || 0.25 };
          });
        }
        if (ak.part2Answers) {
          ak.part2Answers = ak.part2Answers.map((a: any) => {
            const matchingQ = updatedPackage.exams[0].questions.find((q: any) => q.number === a.questionNumber);
            return { ...a, points: matchingQ?.points || a.points || 1.0 };
          });
        }
        if (ak.part3Answers) {
          ak.part3Answers = ak.part3Answers.map((a: any) => {
            const matchingQ = updatedPackage.exams[0].questions.find((q: any) => q.number === a.questionNumber);
            return { ...a, points: matchingQ?.points || a.points || 0.25 };
          });
        }
        if (ak.part4Answers) {
          ak.part4Answers = ak.part4Answers.map((a: any) => {
            const matchingQ = updatedPackage.exams[0].questions.find((q: any) => q.number === a.questionNumber);
            return { ...a, points: matchingQ?.points || a.points || 1.0 };
          });
        }
      }

      if (updatedPackage.metadata) {
        updatedPackage.metadata.totalPoints = roundedTotalPoints;
      }

      // 2. Call backend update
      await OnlineExamService.updateExam(examCode, {
        examPackage: updatedPackage,
        totalPoints: roundedTotalPoints,
      });

      // 3. Save locally if present in exam history
      StorageEngine.saveExamPackage(updatedPackage);

      setSuccessMsg('Đã cập nhật điểm số câu hỏi thành công!');
      setTimeout(() => {
        onSavedSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Không thể lưu thay đổi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-2xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-10">
          <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-950/80 px-3 py-1 rounded-full text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-300 dark:border-teal-800">
            <Sliders className="w-3.5 h-3.5" />
            <span>Xem lại & Điều chỉnh điểm số</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Đề thi: {examDetail?.title || examCode}</span>
            <span className="text-xs font-mono bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
              {examCode}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cho phép xem chi tiết từng câu hỏi trong đề thi và tùy chỉnh điểm số trực tiếp.
          </p>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center space-x-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Đang tải dữ liệu câu hỏi đề thi...</p>
          </div>
        ) : (
          <>
            {/* Presets & Summary Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Tổng số câu:</span>
                  <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-lg font-bold text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700">
                    {questions.length} câu
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Tổng điểm bài thi:</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-300 dark:border-emerald-800 font-mono">
                    {roundedTotalPoints} / 10.0 điểm
                  </span>
                </div>
              </div>

              {/* Quick Actions Toolbar */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                  Gán điểm nhanh:
                </span>
                <button
                  onClick={() => applyPresetPart('PART1', 0.25)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Phần I = 0.25đ
                </button>
                <button
                  onClick={() => applyPresetPart('PART2', 1.0)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Phần II = 1.0đ
                </button>
                <button
                  onClick={() => applyPresetPart('PART3', 0.25)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Phần III = 0.25đ
                </button>
                <button
                  onClick={() => applyPresetPart('PART4', 1.0)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Phần IV = 1.0đ
                </button>
                <button
                  onClick={divideTenPointsEvenly}
                  className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 text-teal-800 dark:text-teal-300 rounded-lg border border-teal-300 dark:border-teal-800 font-bold transition-colors cursor-pointer ml-auto"
                >
                  Chia đều 10 điểm
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {questions.map((q, idx) => {
                const key = q.id || q.number;
                const currentPt = pointsMap[key] ?? 0.25;

                return (
                  <div
                    key={key || idx}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-teal-700 dark:text-teal-400 text-sm">
                          Câu {idx + 1}.
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {q.partType === 'PART1' || !q.partType
                            ? 'TN 4 Lựa chọn'
                            : q.partType === 'PART2'
                            ? 'TN Đúng/Sai'
                            : q.partType === 'PART3'
                            ? 'Trả lời ngắn'
                            : 'Tự luận'}
                        </span>
                      </div>

                      {/* Point control input & presets */}
                      <div className="flex items-center space-x-2 shrink-0 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Điểm:</span>
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          max="10"
                          value={currentPt}
                          onChange={(e) => handlePointChange(key, parseFloat(e.target.value) || 0.05)}
                          className="w-16 bg-white dark:bg-slate-800 text-center font-bold font-mono text-xs py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-teal-700 dark:text-teal-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">đ</span>

                        <div className="hidden sm:flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                          {[0.25, 0.5, 1.0, 1.5, 2.0].map((preset) => (
                            <button
                              key={preset}
                              onClick={() => handlePointChange(key, preset)}
                              className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                                currentPt === preset
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              {preset}đ
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed pl-1">
                      <MathText content={q.content} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi Điểm Số'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
