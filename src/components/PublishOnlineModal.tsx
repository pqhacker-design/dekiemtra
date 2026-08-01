import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, Lock, RefreshCw, School, Shield, Sparkles, X } from 'lucide-react';
import { ExamPackage, ClassItem } from '../types';
import { OnlineExamService } from '../services/onlineExamService';

interface PublishOnlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  examPackage: ExamPackage | null;
  onPublishedSuccess: (code: string) => void;
}

export const PublishOnlineModal: React.FC<PublishOnlineModalProps> = ({
  isOpen,
  onClose,
  examPackage,
  onPublishedSuccess,
}) => {
  const [customCode, setCustomCode] = useState('');
  const [duration, setDuration] = useState<number>(
    examPackage?.metadata?.duration || 45
  );
  const [allowExplanations, setAllowExplanations] = useState(true);

  // Class selection state
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [allowAllClasses, setAllowAllClasses] = useState(true);

  // Anti-cheat options
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [autoSubmitOnTimeout, setAutoSubmitOnTimeout] = useState(true);
  const [warnTabSwitch, setWarnTabSwitch] = useState(true);
  const [disallowPrevious, setDisallowPrevious] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      OnlineExamService.getClasses()
        .then((res) => {
          if (res.success && res.classes) {
            setClassList(res.classes);
          }
        })
        .catch((err) => console.error('Lỗi khi tải danh sách lớp:', err));
    }
  }, [isOpen]);

  if (!isOpen || !examPackage) return null;

  const handleToggleClass = (clsName: string) => {
    if (selectedClasses.includes(clsName)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== clsName));
    } else {
      setSelectedClasses([...selectedClasses, clsName]);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const allowedClassesToSend = allowAllClasses ? [] : selectedClasses;

      const res = await OnlineExamService.saveExam({
        code: customCode.trim() || undefined,
        title: examPackage.metadata?.title || 'Đề kiểm tra',
        subject: examPackage.metadata?.subject || 'Môn học',
        grade: examPackage.metadata?.grade || 'Lớp',
        duration: Number(duration) || 45,
        totalPoints: 10.0,
        topic: examPackage.metadata?.chapterTitle || '',
        allowExplanations,
        allowedClasses: allowedClassesToSend,
        antiCheat: {
          shuffleQuestions,
          shuffleOptions,
          autoSubmitOnTimeout,
          warnTabSwitch,
          disallowPrevious,
          tabSwitchLimit: 3,
        },
        examPackage,
      });

      if (res.success && res.code) {
        onPublishedSuccess(res.code);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể lưu đề thi trực tuyến.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 my-auto max-h-[90vh] flex flex-col overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lưu & Bật Thi Trực Tuyến</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tạo mã đề ngẫu nhiên để cấp cho học sinh làm bài trên hệ thống
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 text-xs">
          {/* Custom Code Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Mã đề thi (để trống để tự tạo mã 6 ký tự):</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">Ví dụ: A7X92Q</span>
            </label>
            <input
              type="text"
              placeholder="VD: PHYT10"
              maxLength={10}
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider font-bold text-teal-700 dark:text-teal-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Time Limit */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Thời gian làm bài (Phút):</span>
            </label>
            <input
              type="number"
              min={5}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 45))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Target Classes Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/60 pb-2 justify-between">
              <div className="flex items-center space-x-2">
                <School className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Phân công Lớp làm bài kiểm tra</span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAllClasses}
                  onChange={(e) => setAllowAllClasses(e.target.checked)}
                  className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                />
                <span>Tất cả các lớp</span>
              </label>
            </div>

            {!allowAllClasses ? (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-slate-500">
                  Chọn các lớp được phép nhập SBD làm bài kiểm tra này:
                </p>
                {classList.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold italic">
                    Chưa có lớp nào trong danh sách. Vui lòng vào mục "Quản lý Lớp & HS" để tạo lớp trước.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {classList.map((cls) => {
                      const isChecked = selectedClasses.includes(cls.name);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => handleToggleClass(cls.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isChecked
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-teal-500'
                          }`}
                        >
                          {isChecked ? '✓ ' : ''}Lớp {cls.name} ({cls.grade})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                Đề thi mở công khai cho tất cả các lớp trong trường.
              </p>
            )}
          </div>

          {/* Anti-Cheat Settings */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700/60 pb-2">
              <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Cấu hình Chống gian lận & Trộn đề</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-medium">Trộn thứ tự câu hỏi</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-medium">Trộn vị trí đáp án</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSubmitOnTimeout}
                  onChange={(e) => setAutoSubmitOnTimeout(e.target.checked)}
                  className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-medium">Tự nộp bài khi hết giờ</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={warnTabSwitch}
                  onChange={(e) => setWarnTabSwitch(e.target.checked)}
                  className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-medium">Cảnh báo khi chuyển tab</span>
              </label>

              <label className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={disallowPrevious}
                  onChange={(e) => setDisallowPrevious(e.target.checked)}
                  className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-medium">Không cho phép xem lại câu trước</span>
              </label>
            </div>
          </div>

          {/* Allow Explanations after submit */}
          <div className="bg-teal-50 dark:bg-teal-950/30 p-3.5 rounded-2xl border border-teal-200 dark:border-teal-800/40">
            <label className="flex items-center space-x-2.5 text-teal-900 dark:text-teal-200 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={allowExplanations}
                onChange={(e) => setAllowExplanations(e.target.checked)}
                className="rounded-md border-teal-400 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span>Cho phép học sinh xem lời giải chi tiết & đáp án sau khi nộp bài</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Hủy
          </button>

          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 shadow-md disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{loading ? 'Đang lưu...' : 'Lưu & Bật Thi Online'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
