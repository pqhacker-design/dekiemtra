import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Key, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearAllData: () => void;
}

const GEMINI_MODELS = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Mặc định - Khuyên dùng',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
    description: 'Tốc độ sinh nhanh, chính xác cao, bám sát chuẩn ma trận CV 7991/BGDĐT. Phù hợp nhất cho mọi đề thi.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    badge: 'Nâng cao - Suy luận sâu',
    badgeClass: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800',
    description: 'Mô hình Pro với khả năng suy luận logic nâng cao cho câu hỏi phân hóa, tự luận VDC và thi học sinh giỏi.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Siêu tốc độ',
    badgeClass: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
    description: 'Phản hồi siêu tốc, giảm tối đa thời gian chờ đợi. Phù hợp cho kiểm tra thử nghiệm hoặc tạo đề ngắn.',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'Phiên bản mới nhất',
    badgeClass: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    description: 'Tự động liên kết tới bản nâng cấp Flash mới nhất từ Google DeepMind.',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onClearAllData,
}) => {
  const [schoolName, setSchoolName] = useState(settings.defaultSchoolName || 'Trường THCS Bình San');
  const [departmentName, setDepartmentName] = useState(settings.defaultDepartmentName || 'Sở Giáo dục và Đào tạo');
  const [teacherName, setTeacherName] = useState(settings.defaultTeacherName || 'Giáo viên THCS / THPT');
  const [customApiKey, setCustomApiKey] = useState(settings.customApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-3.6-flash');
  const [showApiKey, setShowApiKey] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      defaultSchoolName: schoolName,
      defaultDepartmentName: departmentName,
      defaultTeacherName: teacherName,
      customApiKey: customApiKey.trim(),
      selectedModel,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestApiKey = async () => {
    setApiTesting(true);
    setApiStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Xin chào, vui lòng phản hồi ngắn "OK" để kiểm tra kết nối API.',
          customApiKey: customApiKey.trim() || undefined,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kiểm tra API thất bại.');
      }

      setApiStatus({
        type: 'success',
        message: `Kết nối thành công với mô hình ${selectedModel}! Khóa API hoạt động chính xác.`,
      });
    } catch (err: any) {
      setApiStatus({
        type: 'error',
        message: `Lỗi kết nối API (${selectedModel}): ${err.message || 'Không thể xác thực API Key.'}`,
      });
    } finally {
      setApiTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-900/50 px-2.5 py-0.5 rounded-full text-xs font-bold text-teal-800 dark:text-teal-300">
          <span>CẤU HÌNH HỆ THỐNG</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
          Cài Đặt Hệ Thống & Gemini AI
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tùy chỉnh API Key cá nhân, lựa chọn mô hình Gemini AI, thông tin trường học mặc định và quản lý ứng dụng.
        </p>
      </div>

      {/* 1. Gemini API Key Configuration Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                1. Nhập Khóa API Gemini Cá Nhân (Bắt buộc)
              </h3>
              <p className="text-xs text-slate-500">
                Hệ thống không sử dụng API dùng chung. Bắt buộc người dùng phải nhập Gemini API Key cá nhân để sinh đề.
              </p>
            </div>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1"
          >
            <span>Lấy API Key miễn phí tại Google AI Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Gemini API Key cá nhân <span className="text-rose-500">* (Bắt buộc)</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Dán khóa API Gemini của bạn tại đây (AIzaSy...)"
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-mono font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Khóa API Key của bạn sẽ được lưu bảo mật trong trình duyệt (LocalStorage) và không bị lộ ra ngoài.
            </p>
          </div>

          {apiStatus.message && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                apiStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950 border-rose-300 text-rose-800 dark:text-rose-300'
              }`}
            >
              {apiStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{apiStatus.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestApiKey}
              disabled={apiTesting}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${apiTesting ? 'animate-spin' : ''}`} />
              <span>{apiTesting ? 'Đang thử nghiệm...' : 'Kiểm Tra Kết Nối API Key'}</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Gemini AI Model Selection Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                2. Lựa Chọn Mô Hình Gemini AI
              </h3>
              <p className="text-xs text-slate-500">
                Chọn mô hình AI phù hợp nhất với nhu cầu tạo đề thi, ma trận và mức độ phức tạp của bài tập.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {GEMINI_MODELS.map((m) => {
            const isSelected = selectedModel === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{m.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badgeClass}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{m.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-200/50 dark:bg-slate-900/50 px-2.5 py-0.5 rounded-md w-fit">
                  {m.id}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. System Prompt Template Management */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                3. Quản Lý System Prompt (Chuẩn Công Văn 7991/BGDĐT)
              </h3>
              <p className="text-xs text-slate-500">
                Xem và tùy chỉnh quy tắc chỉ dẫn Prompt của Gemini AI khi tạo ma trận, bảng đặc tả và đề thi.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Prompt Quy Tắc Khung Đề Thi</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-extrabold px-2 py-0.5 rounded-full">CV 7991 Standard</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono leading-relaxed bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              Tạo ma trận 4 mức độ tư duy (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao), xuất 3 phần (Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai, Tự luận ngắn), đáp án chi tiết và Rubric chấm điểm tự luận.
            </p>
          </div>
        </div>
      </div>

      {/* 4. System Logs & Audit Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                4. Nhật Ký Hệ Thống & An Ninh (System Audit Logs)
              </h3>
              <p className="text-xs text-slate-500">
                Ghi nhận lịch sử thao tác, tạo đề, truy cập tài khoản và cấp mã thi trực tuyến.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">Đăng nhập tài khoản Admin</span>
              <span className="text-slate-400 text-[10px]">({settings.defaultTeacherName || 'Admin'})</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{new Date().toLocaleTimeString('vi-VN')}</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">Khởi tạo Gemini 3.6 Flash Client</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Hệ thống sẵn sàng</span>
          </div>
        </div>
      </div>

      {/* 5. Backup & Data Export Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                5. Sao Lưu & Khôi Phục Dữ Liệu (Backup & Restore)
              </h3>
              <p className="text-xs text-slate-500">
                Tải xuống bản sao lưu JSON toàn bộ ngân hàng câu hỏi, ma trận và cài đặt ứng dụng.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `VisionTestAI_Backup_${new Date().toISOString().slice(0,10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <span>Tải Xuất JSON Backup</span>
          </button>
        </div>
      </div>

      {/* 6. Default Administrative Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
          6. Thông Tin Trường Học & Giáo Viên Mặc Định
        </h3>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu cài đặt hệ thống thành công!</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên Sở / Phòng Giáo Dục Mặc Định
            </label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên Trường Mặc Định
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên Giáo Viên Mặc Định
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              required
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Tất Cả Cài Đặt</span>
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 space-y-3">
        <h3 className="font-extrabold text-base text-red-800 dark:text-red-300">
          7. Quản Lý Bộ Nhớ LocalStorage
        </h3>
        <p className="text-xs text-red-600 dark:text-red-400">
          Xóa toàn bộ lịch sử đề kiểm tra, cài đặt và ngân hàng câu hỏi khỏi bộ nhớ trình duyệt (LocalStorage).
        </p>

        {clearedSuccess && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã xóa sạch toàn bộ dữ liệu LocalStorage thành công! Hệ thống đã được làm mới.</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowClearConfirmModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Xóa Sạch Dữ Liệu LocalStorage</span>
        </button>
      </div>

      {/* Confirmation Modal for Clear LocalStorage */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Xác Nhận Xóa Dữ Liệu?
                </h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ lịch sử gói đề thi, ma trận, bảng đặc tả và ngân hàng câu hỏi đã lưu trong bộ nhớ LocalStorage của trình duyệt này không?
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear();
                  } catch (e) {}
                  onClearAllData();
                  setShowClearConfirmModal(false);
                  setClearedSuccess(true);
                  setTimeout(() => setClearedSuccess(false), 5000);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-red-600/20 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Đồng Ý Xóa Sạch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
