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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 md:p-6 shadow-2xl relative space-y-4 my-auto max-h-[90vh] flex flex-col overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-1">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cấp Mã Cho Học Sinh</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate px-4">{examTitle}</p>
        </div>

        {/* Big Code Display */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            MÃ ĐỀ THI TRỰC TUYẾN
          </span>
          <div className="flex items-center justify-center space-x-3">
            <span className="text-3xl font-black tracking-widest text-teal-600 dark:text-teal-400 font-mono">
              {examCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Sao chép mã đề"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copiedCode && (
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              Đã sao chép mã đề {examCode}!
            </p>
          )}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center space-y-1.5">
          <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700">
            <img
              src={qrCodeApiUrl}
              alt={`QR Code ${examCode}`}
              className="w-36 h-36 object-contain rounded-lg"
              onError={(e) => {
                // Fallback text if QR API unreachable
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            Học sinh quét mã QR bằng camera điện thoại để vào làm bài
          </p>
        </div>

        {/* Direct Link */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Đường dẫn tham gia trực tiếp:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300 focus:outline-hidden truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã chép' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center space-x-3 shrink-0">
          {onOpenStudentExam && (
            <button
              onClick={() => {
                onClose();
                onOpenStudentExam(examCode);
              }}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Vào thi thử nghiệm</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
