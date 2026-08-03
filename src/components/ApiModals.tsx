import React, { useState } from 'react';
import { Key, AlertTriangle, ExternalLink, Eye, EyeOff, Sparkles, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { StorageEngine } from '../services/storageEngine';

interface ApiKeyInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newApiKey: string) => void;
  title?: string;
  message?: string;
}

export const ApiKeyInputModal: React.FC<ApiKeyInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Yêu Cầu Nhập Gemini API Key',
  message = 'Ứng dụng chưa nhận được Gemini API Key cá nhân của bạn. Vui lòng nhập khóa API bên dưới để bắt đầu sinh đề thi AI chuẩn Công văn 7991/BGDĐT.',
}) => {
  const settings = StorageEngine.getSettings();
  const [apiKey, setApiKey] = useState(settings.customApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('Vui lòng nhập khóa API Key trước khi lưu.');
      return;
    }
    const updated = { ...settings, customApiKey: trimmed };
    StorageEngine.saveSettings(updated);
    onSave(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-left space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{title}</h3>
            <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold flex items-center space-x-1 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Gemini AI Engine</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          {message}
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Khóa Gemini API Key Cá Nhân <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (error) setError('');
              }}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none dark:text-white pr-11"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        </div>

        <div className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
          <span>Chưa có API Key? Lấy miễn phí tại Google AI Studio:</span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 font-bold text-teal-700 dark:text-teal-300 hover:underline ml-2 shrink-0"
          >
            <span>Lấy Key ngay</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-lg shadow-teal-600/25 flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu & Tiếp Tục</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNewKeyAndRetry: (newApiKey: string) => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  onClose,
  onSaveNewKeyAndRetry,
}) => {
  const settings = StorageEngine.getSettings();
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleUpdateKey = () => {
    const trimmed = newKey.trim();
    if (trimmed) {
      const updated = { ...settings, customApiKey: trimmed };
      StorageEngine.saveSettings(updated);
      onSaveNewKeyAndRetry(trimmed);
    } else {
      onSaveNewKeyAndRetry(settings.customApiKey || '');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 text-left space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Hạn Ngạch API Đã Hết (Quota Exceeded)</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
              Mã lỗi: RESOURCE_EXHAUSTED / HTTP 429
            </p>
          </div>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-800/80 text-xs text-rose-900 dark:text-rose-200 space-y-2">
          <p className="font-bold">
            Khóa API Key Gemini hiện tại của bạn đã vượt quá hạn ngạch (Quota) hoặc giới hạn tần suất gọi API (Rate Limit) do Google quy định cho tài khoản này.
          </p>
          <ul className="list-disc pl-4 space-y-1 text-rose-800 dark:text-rose-300">
            <li>Tài khoản Free Tier giới hạn tối đa số lượng token và số lượt sinh đề trong 1 phút / 1 ngày.</li>
            <li>Bạn có thể chờ từ 1 - 2 phút rồi bấm <strong>"Thử Lại Tự Động"</strong>.</li>
            <li>Hoặc dán ngay một <strong>API Key mới</strong> ở bên dưới để tiếp tục sinh đề thi lập tức.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Dán API Key Dự Phòng Mới (Tùy chọn)
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Nhập API Key khác nếu có..."
              className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none dark:text-white pr-11"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
          <span className="text-slate-600 dark:text-slate-300">Tạo API Key mới tại Google AI Studio:</span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 font-bold text-teal-700 dark:text-teal-300 hover:underline"
          >
            <span>aistudio.google.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleUpdateKey}
            className="w-1/2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-lg shadow-teal-600/25 flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{newKey.trim() ? 'Đổi Key & Sinh Đề Lại' : 'Thử Lại Ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'error',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
            type === 'error'
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{title}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
        >
          Đồng Ý
        </button>
      </div>
    </div>
  );
};
