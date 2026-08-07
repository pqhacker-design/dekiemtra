import React, { useState } from 'react';
import { Check, Copy, ExternalLink, QrCode, X } from 'lucide-react';

interface ShareExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examCode: string;
  examTitle?: string;
  onOpenStudentExam?: (code: string) => void;
}

export const ShareExamModal: React.FC<ShareExamModalProps> = ({
  isOpen,
  onClose,
  examCode,
  examTitle = 'Đề kiểm tra',
  onOpenStudentExam,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentHost = window.location.origin + window.location.pathname;
  const shareUrl = `${currentHost.replace(/\/$/, '')}?exam=${encodeURIComponent(examCode)}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl
  )}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(examCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative space-y-6 my-auto max-h-[92vh] flex flex-col overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3.5 border-b border-slate-100 dark:border-slate-800 pb-4 pr-8">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Cấp Mã Cho Học Sinh Làm Bài</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{examTitle}</p>
          </div>
        </div>

        {/* 2-Column Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* LEFT COLUMN: QR CODE CARD (md:col-span-5) */}
          <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
              <img
                src={qrCodeApiUrl}
                alt={`QR Code ${examCode}`}
                className="w-40 h-40 object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-[10px] rounded-full uppercase tracking-wider border border-teal-300 dark:border-teal-800">
                Mã QR Quét Tự Động
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Học sinh dùng camera điện thoại hoặc máy tính bảng để quét mã vào thi ngay
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: BIG CODE & DIRECT LINK (md:col-span-7) */}
          <div className="md:col-span-7 space-y-4">
            {/* Big Code Display */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-teal-950/40 p-4 rounded-2xl border border-teal-200/80 dark:border-teal-800/50 space-y-2">
              <span className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                MÃ THI TRỰC TUYẾN CHÍNH THỨC
              </span>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-teal-300/60 dark:border-teal-700/60 shadow-xs">
                <span className="text-3xl md:text-4xl font-black tracking-widest text-teal-600 dark:text-teal-400 font-mono">
                  {examCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0"
                  title="Sao chép mã đề"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Đã chép mã!' : 'Sao Chép Mã'}</span>
                </button>
              </div>
            </div>

            {/* Direct Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Đường dẫn làm bài thi trực tiếp:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300 focus:outline-hidden truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Đã sao chép' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
              💡 Học sinh chỉ cần nhập <strong>Mã đề {examCode}</strong> và <strong>Số báo danh (SBD)</strong> ở giao diện "Học sinh làm bài" để tiến hành thi.
            </p>
          </div>
        </div>

        {/* Action Buttons Footer Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Đề thi đã sẵn sàng tiếp nhận bài làm của học sinh.
          </p>

          <div className="flex items-center space-x-3 ml-auto">
            {onOpenStudentExam && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStudentExam(examCode);
                }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 shadow-md cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Vào Thi Thử Nghệm</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
