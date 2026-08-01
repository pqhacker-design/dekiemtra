import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Download, FileCode, Menu, Sparkles, UserCheck, FileText, CheckCircle2, Share2, Zap } from 'lucide-react';
import { AppSettings, ExamPackage } from '../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  settings: AppSettings;
  currentExamPackage: ExamPackage | null;
  onOpenPublishModal?: () => void;
  onExportWord?: (mode?: 'full' | 'exams' | 'answers') => void;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  settings,
  currentExamPackage,
  onOpenPublishModal,
  onExportWord,
  onExportPdf,
  onExportExcel,
}) => {
  const [isWordDropdownOpen, setIsWordDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWordDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 px-4 md:px-8 transition-all flex items-center justify-between shadow-xs">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Mở Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <span className="hidden sm:inline-flex items-center px-3 py-1 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20 shadow-2xs">
            <Sparkles className="w-3 h-3 mr-1 text-emerald-500 animate-spin-slow" />
            Công văn 7991/BGDĐT
          </span>
        </div>
      </div>

      {/* Right: Action Buttons & Teacher Profile */}
      <div className="flex items-center gap-3">
        {currentExamPackage && (
          <div className="hidden sm:flex items-center gap-2">
            {onOpenPublishModal && (
              <button
                onClick={onOpenPublishModal}
                className="btn-glow-emerald text-white rounded-2xl font-black text-[11px] px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Lưu & Cấp Mã Thi Online Cho Học Sinh"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Cấp Mã Thi Online</span>
              </button>
            )}
            {onExportWord && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsWordDropdownOpen(!isWordDropdownOpen)}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-2xl font-bold text-[11px] px-3.5 py-2 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Tùy chọn xuất Word (.docx)"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Xuất Word</span>
                  <ChevronDown className="w-3 h-3 text-blue-500" />
                </button>

                {isWordDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        onExportWord('full');
                        setIsWordDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 text-xs text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div>Xuất Trọn Gói</div>
                        <div className="text-[10px] text-slate-400 font-normal">Ma trận + Bảng đặc tả + Đề + Đáp án</div>
                      </div>
                    </button>
                    <div className="h-[1px] bg-slate-200/50 dark:bg-slate-800/80 my-1" />
                    <button
                      onClick={() => {
                        onExportWord('exams');
                        setIsWordDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 text-xs text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-emerald-600 dark:text-emerald-400">Chỉ Xuất Đề Thi</div>
                        <div className="text-[10px] text-slate-400 font-normal">Các mã đề thi (không kèm đáp án)</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        onExportWord('answers');
                        setIsWordDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-3 text-xs text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-cyan-600 dark:text-cyan-400">Chỉ Xuất Đáp Án</div>
                        <div className="text-[10px] text-slate-400 font-normal">Đáp án chi tiết + Rubric chấm điểm</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold text-[11px] px-3.5 py-2 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Xuất Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
            )}
            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-2xl font-bold text-[11px] px-3.5 py-2 transition-all flex items-center gap-1.5 cursor-pointer"
                title="In hoặc Xuất PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>In / PDF</span>
              </button>
            )}
          </div>
        )}

        <div className="h-7 w-[1px] bg-slate-200/80 dark:bg-slate-800/80 mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">
              {settings.defaultTeacherName || 'Giáo viên THCS/THPT'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              {settings.defaultSchoolName || 'Trường THCS Bình San'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-600 p-[1.5px] shadow-sm shrink-0">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-xs text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
