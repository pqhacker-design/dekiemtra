import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Grid,
  Home,
  Laptop,
  Layers,
  Moon,
  PlusCircle,
  QrCode,
  School,
  Settings,
  Sun,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export type TabType =
  | 'dashboard'
  | 'generator'
  | 'classes'
  | 'matrix'
  | 'specification'
  | 'bank'
  | 'online_bank'
  | 'student_results'
  | 'student_exam'
  | 'multicode'
  | 'answers'
  | 'user_management'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  isOpen,
  setIsOpen,
  isCollapsed: externalIsCollapsed,
  setIsCollapsed: externalSetIsCollapsed,
}) => {
  const { isAdmin } = useAuth();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const toggleCollapse = () => {
    if (externalSetIsCollapsed) {
      externalSetIsCollapsed(!isCollapsed);
    } else {
      setInternalIsCollapsed(!isCollapsed);
    }
  };

  const allMenuItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: string; glowColor?: string; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard AI', icon: Home, glowColor: 'emerald' },
    { id: 'generator', label: 'Tạo đề kiểm tra', icon: PlusCircle, badge: 'CV 7991', glowColor: 'cyan' },
    { id: 'classes', label: 'Quản lý Lớp & HS', icon: School, badge: 'LỚP & HS', glowColor: 'indigo' },
    { id: 'online_bank', label: 'Kho đề trực tuyến', icon: QrCode, badge: 'ONLINE', glowColor: 'emerald' },
    { id: 'student_results', label: 'Kết quả học sinh', icon: UserCheck, badge: 'ONLINE', glowColor: 'cyan' },
    { id: 'student_exam', label: 'Học sinh làm bài', icon: Laptop, badge: 'ONLINE', glowColor: 'indigo' },
    { id: 'matrix', label: 'Ma trận đề thi', icon: Grid },
    { id: 'specification', label: 'Bảng đặc tả YCCĐ', icon: Layers },
    { id: 'bank', label: 'Ngân hàng câu hỏi', icon: BookOpen },
    { id: 'multicode', label: 'Đề đã tạo - Các mã đề', icon: FileSpreadsheet },
    { id: 'answers', label: 'Đáp án & Rubric', icon: CheckSquare },
    { id: 'user_management', label: 'Quản lý tài khoản', icon: Users, badge: 'ADMIN', adminOnly: true },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings, badge: 'API key' },
  ];

  // Filter out admin-only items if user is not admin (Requirement 6 & 15)
  const menuItems = allMenuItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-out lg:translate-x-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${
          theme === 'dark'
            ? 'bg-slate-950/80 border-r border-slate-800/80 text-slate-100 shadow-[0_0_40px_rgba(0,0,0,0.8)]'
            : 'bg-white/85 border-r border-slate-200/80 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)]'
        } backdrop-blur-2xl flex flex-col justify-between`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header Brand */}
          <div className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600 p-[1.5px] shadow-lg shadow-emerald-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white font-black text-sm tracking-wider">
                  AI
                </div>
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <h1 className="text-sm font-black tracking-wide bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
                    VISION TEST AI
                  </h1>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                    KẾ HOẠCH 7991 • v2.5
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 pr-1.5 space-y-1.5 overflow-y-auto flex-1 min-h-0 sidebar-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`relative w-full flex items-center ${
                    isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                  } py-3 rounded-2xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-indigo-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-full text-white shadow-xs shrink-0 ${
                      item.adminOnly
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Settings & Theme Toggle */}
          <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2 shrink-0">
            {!isCollapsed && (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 dark:border-emerald-500/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                      Gemini 2.5 Flash
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">
                    Sẵn sàng
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tốc độ xử lý: ~1.2s / đề thi
                </p>
              </div>
            )}

            <div
              className={`flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
              } rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60`}
            >
              {!isCollapsed && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Giao diện</span>}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-1.5 lg:px-3 lg:py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:text-emerald-500 shadow-xs transition-colors flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
                title={theme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    {!isCollapsed && <span>Sáng</span>}
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-400" />
                    {!isCollapsed && <span>Tối</span>}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
