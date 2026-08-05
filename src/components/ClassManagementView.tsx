import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  FileSpreadsheet,
  Search,
  School,
  UserPlus,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowLeft,
  GraduationCap,
  Download,
  ClipboardList,
  RefreshCw,
  RotateCcw,
  Award,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { ClassItem, StudentItem } from '../types';
import { OnlineExamService } from '../services/onlineExamService';
import { ExportExcel } from '../services/exportExcel';

interface ClassManagementViewProps {
  onNavigateTab?: (tab: any) => void;
}

export const ClassManagementView: React.FC<ClassManagementViewProps> = ({ onNavigateTab }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [allGlobalStudents, setAllGlobalStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState<boolean>(false);

  // Form states for class
  const [classNameInput, setClassNameInput] = useState('');
  const [gradeInput, setGradeInput] = useState('Khối 10');
  const [schoolYearInput, setSchoolYearInput] = useState('2025 - 2026');
  const [teacherInput, setTeacherInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Form states for single student
  const [studentSbdInput, setStudentSbdInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentGenderInput, setStudentGenderInput] = useState('Nam');
  const [studentDobInput, setStudentDobInput] = useState('');
  const [studentNotesInput, setStudentNotesInput] = useState('');

  // Form states for bulk student import
  const [bulkText, setBulkText] = useState('');

  // Auto-generation SBD prefix settings
  const [sbdPrefixMode, setSbdPrefixMode] = useState<'CLASS' | 'SBD' | 'CUSTOM'>('CLASS');
  const [customPrefix, setCustomPrefix] = useState('');

  // Confirmation Modal & Toast Notification State
  const [isSubmittingClass, setIsSubmittingClass] = useState<boolean>(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState<boolean>(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState<boolean>(false);
  const [isProcessingConfirm, setIsProcessingConfirm] = useState<boolean>(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete_class' | 'delete_student' | 'reset_attempt' | 'auto_sbd';
    payload: any;
    title: string;
    message: string;
    buttonText?: string;
  } | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load classes & students
  const loadClassesAndStudents = async () => {
    setIsLoading(true);
    try {
      const clsRes = await OnlineExamService.getClasses();
      if (clsRes.success) {
        setClasses(clsRes.classes);
        if (!selectedClassId && clsRes.classes.length > 0) {
          setSelectedClassId(clsRes.classes[0].id);
        }
      }

      const stRes = await OnlineExamService.getStudents();
      if (stRes.success) {
        setStudents(stRes.students);
      }

      const globalStRes = await OnlineExamService.getStudents(undefined, true);
      if (globalStRes.success) {
        setAllGlobalStudents(globalStRes.students);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu Lớp & Học sinh:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassesAndStudents();
  }, []);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0] || null;

  // Filtered students for current selected class
  const classStudents = students.filter(
    (s) =>
      currentClass &&
      (s.classId === currentClass.id ||
        s.className.trim().toLowerCase() === currentClass.name.trim().toLowerCase())
  );

  const displayedStudents = classStudents.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.sbd && s.sbd.toLowerCase().includes(q)) ||
      (s.className && s.className.toLowerCase().includes(q))
    );
  });

  // Handle Save Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim() || isSubmittingClass) return;

    setIsSubmittingClass(true);
    try {
      const res = await OnlineExamService.saveClass({
        name: classNameInput.trim(),
        grade: gradeInput,
        schoolYear: schoolYearInput,
        teacherName: teacherInput.trim(),
        notes: notesInput.trim(),
      });

      if (res.success) {
        setClassNameInput('');
        setTeacherInput('');
        setNotesInput('');
        setShowAddClassModal(false);
        await loadClassesAndStudents();
        if (res.class?.id) {
          setSelectedClassId(res.class.id);
        }
        showToast('success', `Đã tạo lớp ${classNameInput.trim()} thành công.`);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi khi tạo lớp: ' + (err.message || 'Không thể tạo lớp'));
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Handle Delete Class Modal Request
  const handleDeleteClass = (classId: string, className: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete_class',
      payload: { classId, className },
      title: `Xóa Lớp ${className}`,
      message: `Bạn có chắc chắn muốn xóa lớp ${className}? Tất cả danh sách học sinh thuộc lớp này cũng sẽ bị xóa khỏi hệ thống.`,
      buttonText: 'Xác nhận Xóa Lớp',
    });
  };

  // Helper to generate next available SBD for a class (guaranteed globally unique across all users)
  const generateNextSbd = (clsName: string, existingInClass: StudentItem[], indexOffset = 1) => {
    const cleanCls = clsName.replace(/\s+/g, '').toUpperCase();
    const takenSet = new Set(
      allGlobalStudents
        .map((s) => (s.sbd ? s.sbd.trim().toUpperCase() : ''))
        .filter(Boolean)
    );

    let candidateIdx = existingInClass.length + indexOffset;
    let candidatePadded = candidateIdx < 10 ? `0${candidateIdx}` : `${candidateIdx}`;
    let candidateSbd = `${cleanCls}${candidatePadded}`;

    while (takenSet.has(candidateSbd)) {
      candidateIdx++;
      candidatePadded = candidateIdx < 10 ? `0${candidateIdx}` : `${candidateIdx}`;
      candidateSbd = `${cleanCls}${candidatePadded}`;
    }

    return candidateSbd;
  };

  // Open Add Student Modal
  const handleOpenAddStudentModal = () => {
    setEditingStudent(null);
    setStudentSbdInput('');
    setStudentNameInput('');
    setStudentGenderInput('Nam');
    setStudentDobInput('');
    setStudentNotesInput('');
    setShowAddStudentModal(true);
  };

  // Open Edit Student Modal
  const handleOpenEditStudentModal = (student: StudentItem) => {
    setEditingStudent(student);
    setStudentSbdInput(student.sbd || '');
    setStudentNameInput(student.name || '');
    setStudentGenderInput(student.gender || 'Nam');
    setStudentDobInput(student.dob || '');
    setStudentNotesInput(student.notes || '');
    setShowAddStudentModal(true);
  };

  // Handle Save (Create / Edit) Single Student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !studentNameInput.trim() || isSubmittingStudent) return;

    let sbd = studentSbdInput.trim();
    if (!sbd) {
      if (editingStudent && editingStudent.sbd) {
        sbd = editingStudent.sbd;
      } else {
        sbd = generateNextSbd(currentClass.name, classStudents, 1);
      }
    } else {
      sbd = sbd.toUpperCase();
    }

    // Check duplicate SBD globally across all users/students
    const normSbd = sbd.trim().toUpperCase();
    const conflict = allGlobalStudents.find(
      (s) => s.id !== editingStudent?.id && s.sbd && s.sbd.trim().toUpperCase() === normSbd
    );

    if (conflict) {
      showToast(
        'error',
        `Số báo danh '${sbd}' đã thuộc về học sinh '${conflict.name}' (Lớp ${conflict.className}). Vui lòng chọn SBD khác!`
      );
      return;
    }

    setIsSubmittingStudent(true);
    try {
      const studentPayload: any = {
        classId: currentClass.id,
        className: currentClass.name,
        sbd,
        name: studentNameInput.trim(),
        gender: studentGenderInput,
        dob: studentDobInput.trim(),
        notes: studentNotesInput.trim(),
      };

      if (editingStudent?.id) {
        studentPayload.id = editingStudent.id;
      }

      const res = await OnlineExamService.saveStudents(studentPayload);

      if (res.success) {
        setStudentSbdInput('');
        setStudentNameInput('');
        setStudentDobInput('');
        setStudentNotesInput('');
        setEditingStudent(null);
        setShowAddStudentModal(false);
        await loadClassesAndStudents();
        showToast(
          'success',
          editingStudent
            ? `Đã cập nhật thông tin học sinh ${studentNameInput.trim()}.`
            : `Đã thêm học sinh ${studentNameInput.trim()} vào lớp ${currentClass.name}.`
        );
      }
    } catch (err: any) {
      showToast('error', 'Lỗi khi lưu thông tin học sinh: ' + err.message);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // Handle Bulk Import Students
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !bulkText.trim() || isSubmittingBulk) return;

    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setIsSubmittingBulk(true);
    const newStudents: any[] = [];
    const cleanCls = currentClass.name.replace(/\s+/g, '').toUpperCase();

    const takenSet = new Set(
      allGlobalStudents
        .map((s) => (s.sbd ? s.sbd.trim().toUpperCase() : ''))
        .filter(Boolean)
    );

    lines.forEach((line, idx) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      let sbd = '';
      let name = '';
      let gender = 'Nam';
      let dob = '';

      if (parts.length >= 2 && /^[A-Z0-9]+$/i.test(parts[0])) {
        sbd = parts[0].toUpperCase();
        name = parts[1];
        gender = parts[2] || 'Nam';
        dob = parts[3] || '';
      } else {
        name = line;
        let candidateIdx = classStudents.length + idx + 1;
        let padded = candidateIdx < 10 ? `0${candidateIdx}` : `${candidateIdx}`;
        sbd = `${cleanCls}${padded}`;
        while (takenSet.has(sbd)) {
          candidateIdx++;
          padded = candidateIdx < 10 ? `0${candidateIdx}` : `${candidateIdx}`;
          sbd = `${cleanCls}${padded}`;
        }
      }

      if (sbd) {
        takenSet.add(sbd);
      }

      if (name) {
        newStudents.push({
          classId: currentClass.id,
          className: currentClass.name,
          sbd,
          name,
          gender,
          dob,
        });
      }
    });

    try {
      const res = await OnlineExamService.saveStudents(newStudents);
      if (res.success) {
        setBulkText('');
        setShowBulkImportModal(false);
        await loadClassesAndStudents();
        showToast('success', `Đã nhập thành công ${newStudents.length} học sinh vào lớp ${currentClass.name}!`);
      }
    } catch (err: any) {
      showToast('error', 'Lỗi khi nhập danh sách học sinh: ' + err.message);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Auto-generate / re-index all SBDs in current class Request
  const handleAutoGenerateSBDs = () => {
    if (!currentClass || classStudents.length === 0) return;
    setConfirmModal({
      isOpen: true,
      type: 'auto_sbd',
      payload: {},
      title: `Tự Động Sinh Số Báo Danh`,
      message: `Tự động đánh lại Số Báo Danh (SBD) cho tất cả ${classStudents.length} học sinh lớp ${currentClass.name}?`,
      buttonText: 'Xác nhận Sinh SBD',
    });
  };

  // Delete single student Request
  const handleDeleteStudent = (studentId: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete_student',
      payload: { studentId, name },
      title: `Xóa Học Sinh ${name}`,
      message: `Bạn có chắc chắn muốn xóa học sinh "${name}" khỏi danh sách lớp?`,
      buttonText: 'Xác nhận Xóa',
    });
  };

  // Reset Student Exam Attempt (Allow Retake for SBD) Request
  const handleResetStudentAttempt = (sbd: string, name: string) => {
    if (!sbd) {
      showToast('error', 'Học sinh này chưa có Số báo danh (SBD).');
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'reset_attempt',
      payload: { sbd, name },
      title: `Cho Phép Làm Lại Bài Thi`,
      message: `Cho phép học sinh "${name}" (SBD: ${sbd}) làm lại tất cả bài kiểm tra? Hành động này sẽ xóa các lượt làm bài trước đó của SBD ${sbd} để học sinh có thể nhập lại SBD và làm lại bài thi.`,
      buttonText: 'Đồng ý Cho Làm Lại',
    });
  };

  // Execute Confirmation Action
  const executeConfirmAction = async () => {
    if (!confirmModal || isProcessingConfirm) return;
    const { type, payload } = confirmModal;
    setIsProcessingConfirm(true);

    try {
      if (type === 'delete_class') {
        const res = await OnlineExamService.deleteClass(payload.classId, payload.className);
        if (res.success) {
          const remaining = classes.filter((c) => c.id !== payload.classId);
          setClasses(remaining);
          if (selectedClassId === payload.classId) {
            setSelectedClassId(remaining[0]?.id || null);
          }
          await loadClassesAndStudents();
          showToast('success', `Đã xóa thành công lớp ${payload.className} cùng toàn bộ danh sách học sinh.`);
        }
      } else if (type === 'delete_student') {
        const res = await OnlineExamService.deleteStudent(payload.studentId);
        if (res.success) {
          await loadClassesAndStudents();
          showToast('success', `Đã xóa học sinh ${payload.name}.`);
        }
      } else if (type === 'reset_attempt') {
        const res = await OnlineExamService.resetStudentSession({ sbd: payload.sbd, studentName: payload.name });
        if (res.success) {
          showToast('success', res.message || `Đã reset lượt làm bài cho học sinh ${payload.name} (SBD: ${payload.sbd}).`);
        }
      } else if (type === 'auto_sbd') {
        if (currentClass) {
          const prefix =
            sbdPrefixMode === 'CLASS'
              ? currentClass.name.replace(/\s+/g, '').toUpperCase()
              : sbdPrefixMode === 'SBD'
              ? 'SBD'
              : (customPrefix.trim() || 'HS').toUpperCase();

          const takenSet = new Set(
            allGlobalStudents
              .filter((s) => !classStudents.some((cs) => cs.id === s.id))
              .map((s) => (s.sbd ? s.sbd.trim().toUpperCase() : ''))
              .filter(Boolean)
          );

          const updatedStudents = classStudents.map((st, idx) => {
            let candidateIdx = idx + 1;
            let padded = candidateIdx < 10 ? `0${candidateIdx}` : `${candidateIdx}`;
            let candidateSbd = `${prefix}${padded}`;

            while (takenSet.has(candidateSbd)) {
              candidateIdx++;
              padded = candidateIdx < 10 ? `0${candidateIdx}` : `${candidateIdx}`;
              candidateSbd = `${prefix}${padded}`;
            }
            takenSet.add(candidateSbd);

            return {
              ...st,
              sbd: candidateSbd,
            };
          });

          const res = await OnlineExamService.saveStudents(updatedStudents);
          if (res.success) {
            await loadClassesAndStudents();
            showToast('success', `Đã cập nhật tự động SBD cho ${classStudents.length} học sinh lớp ${currentClass.name}!`);
          }
        }
      }
      setConfirmModal(null);
    } catch (err: any) {
      showToast('error', 'Lỗi khi thực hiện thao tác: ' + (err.message || 'Thao tác thất bại'));
    } finally {
      setIsProcessingConfirm(false);
    }
  };

  // Export Roster to Excel
  const handleExportRosterExcel = () => {
    if (!currentClass || classStudents.length === 0) {
      showToast('error', 'Lớp chưa có danh sách học sinh để xuất Excel.');
      return;
    }

    const data = classStudents.map((st, idx) => ({
      STT: idx + 1,
      'Số Báo Danh (SBD)': st.sbd || '—',
      'Họ và Tên': st.name,
      Lớp: st.className,
      'Giới tính': st.gender || 'Nam',
      'Ngày sinh': st.dob || '—',
      'Ghi chú': st.notes || '',
    }));

    ExportExcel.exportStudentListToExcel(classStudents, currentClass.name);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 text-xs font-bold uppercase tracking-wider">
            <School className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Quản Lý Lớp & Số Báo Danh (SBD)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Quản Lý Lớp Học & Học Sinh
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Tạo lớp học, quản lý danh sách học sinh và tự động sinh <strong>Số Báo Danh (SBD)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddClassModal(true)}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Lớp Mới</span>
          </button>
        </div>
      </div>

      {/* Top Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tổng Số Lớp</span>
            <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{classes.length}</div>
          <p className="text-[11px] text-slate-500">Lớp học trong hệ thống</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tổng Số Học Sinh</span>
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{students.length}</div>
          <p className="text-[11px] text-slate-500">Học sinh đã được quản lý</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Lớp Đang Chọn</span>
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white truncate">
            {currentClass ? currentClass.name : 'Chưa có'}
          </div>
          <p className="text-[11px] text-slate-500">{classStudents.length} học sinh</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Chế Độ SBD</span>
            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <Hash className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">Tự Động Sinh</div>
          <p className="text-[11px] text-slate-500">Tra cứu SBD thần tốc</p>
        </div>
      </div>

      {/* Main Content Layout: Class List Sidebar + Roster Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Class Navigation Cards (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Danh Sách Lớp Học</h3>
              </div>
              <button
                onClick={() => setShowAddClassModal(true)}
                className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 hover:bg-teal-100 transition-colors"
                title="Tạo lớp mới"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <School className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500">Chưa có lớp học nào trong hệ thống.</p>
                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  Tạo lớp ngay
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {classes.map((cls) => {
                  const isSelected = currentClass?.id === cls.id;
                  const count = students.filter(
                    (s) => s.classId === cls.id || s.className.trim().toLowerCase() === cls.name.trim().toLowerCase()
                  ).length;

                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-500 dark:border-teal-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white text-base">
                            Lớp {cls.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {cls.grade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          GVCN: {cls.teacherName || 'Chưa cập nhật'} | NH: {cls.schoolYear}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                          {count} HS
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(cls.id, cls.name);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                          title="Xóa lớp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Student Roster Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentClass ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-xs space-y-5">
              {/* Roster Header Actions */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      Danh Sách Học Sinh - Lớp {currentClass.name}
                    </h2>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {classStudents.length} học sinh
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý SBD và danh sách làm bài thi kiểm tra trực tuyến
                  </p>
                </div>

                {/* Toolbar Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={handleAutoGenerateSBDs}
                    className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Tự động đánh lại SBD"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Tự động sinh SBD</span>
                  </button>

                  <button
                    onClick={() => setShowBulkImportModal(true)}
                    className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Nhập danh sách</span>
                  </button>

                  <button
                    onClick={handleOpenAddStudentModal}
                    className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm học sinh</span>
                  </button>

                  <button
                    onClick={handleExportRosterExcel}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    title="Xuất danh sách Excel"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Số báo danh (SBD) hoặc Họ tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Roster Table */}
              {displayedStudents.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      Chưa có học sinh nào
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Thêm từng học sinh hoặc nhập nhanh danh sách danh sách từ văn bản/Excel để bắt đầu.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setShowBulkImportModal(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                    >
                      Nhập hàng loạt từ văn bản
                    </button>
                    <button
                      onClick={handleOpenAddStudentModal}
                      className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
                    >
                      Thêm 1 học sinh
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">STT</th>
                        <th className="py-3 px-4">Số Báo Danh (SBD)</th>
                        <th className="py-3 px-4">Họ và Tên</th>
                        <th className="py-3 px-4">Giới tính</th>
                        <th className="py-3 px-4">Ngày sinh</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {displayedStudents.map((st, idx) => (
                        <tr
                          key={st.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 text-center font-bold text-slate-400 text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-teal-700 dark:text-teal-400 font-mono text-sm">
                            <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60">
                              {st.sbd || 'Chưa có'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {st.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                            {st.gender || 'Nam'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs">
                            {st.dob || '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleOpenEditStudentModal(st)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors cursor-pointer"
                                title="Chỉnh sửa thông tin học sinh"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleResetStudentAttempt(st.sbd, st.name)}
                                className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Cho phép học sinh/SBD này làm lại bài thi"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Cho làm lại</span>
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(st.id, st.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                                title="Xóa học sinh"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500">
              Vui lòng chọn hoặc tạo mới một lớp học.
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Create Class */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Tạo Lớp Học Mới</h3>
              </div>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Tên Lớp (*)
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 10A1, 11B2, 12A5..."
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Khối Lớp
                  </label>
                  <select
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm font-semibold focus:outline-hidden"
                  >
                    <option value="Khối 6">Khối 6</option>
                    <option value="Khối 7">Khối 7</option>
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 9">Khối 9</option>
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Năm Học
                  </label>
                  <input
                    type="text"
                    value={schoolYearInput}
                    onChange={(e) => setSchoolYearInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Giáo Viên Chủ Nhiệm
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn Minh"
                  value={teacherInput}
                  onChange={(e) => setTeacherInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Ghi Chú
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về lớp..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-sm focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isSubmittingClass}
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClass}
                  className={`px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer ${
                    isSubmittingClass ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmittingClass ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo lớp...</span>
                    </>
                  ) : (
                    <span>Tạo Lớp</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add or Edit Single Student */}
      {showAddStudentModal && currentClass && (() => {
        const enteredSbdNorm = studentSbdInput.trim().toUpperCase();
        const duplicateConflict = enteredSbdNorm
          ? allGlobalStudents.find(
              (s) =>
                s.id !== editingStudent?.id &&
                s.sbd &&
                s.sbd.trim().toUpperCase() === enteredSbdNorm
            )
          : null;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {editingStudent ? (
                    <Edit2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  )}
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingStudent ? `Sửa Thông Tin - ${editingStudent.name}` : `Thêm Học Sinh - Lớp ${currentClass.name}`}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setEditingStudent(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Số Báo Danh (SBD)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={
                        editingStudent
                          ? editingStudent.sbd || 'Nhập SBD mới...'
                          : `Mặc định tự động: ${generateNextSbd(currentClass.name, classStudents, 1)}`
                      }
                      value={studentSbdInput}
                      onChange={(e) => setStudentSbdInput(e.target.value)}
                      className={`flex-1 bg-slate-50 dark:bg-slate-800 border ${
                        duplicateConflict
                          ? 'border-rose-500 focus:ring-2 focus:ring-rose-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500'
                      } rounded-2xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-hidden`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextSbd = generateNextSbd(currentClass.name, classStudents, 1);
                        setStudentSbdInput(nextSbd);
                      }}
                      className="px-3 py-2.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      title="Tự động tạo Số Báo Danh duy nhất không trùng"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      Tự sinh SBD
                    </button>
                  </div>

                  {duplicateConflict ? (
                    <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in duration-150">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                      <div>
                        <strong>Cảnh báo trùng SBD:</strong> Số báo danh <span className="font-mono font-bold uppercase">{enteredSbdNorm}</span> đã thuộc về học sinh <strong>{duplicateConflict.name}</strong> (Lớp {duplicateConflict.className}). Vui lòng nhập SBD khác!
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      {editingStudent
                        ? 'Nhập SBD mới hoặc giữ nguyên. SBD của học sinh trên hệ thống phải là duy nhất.'
                        : `Để trống hệ thống sẽ tự sinh SBD (VD: ${generateNextSbd(currentClass.name, classStudents, 1)})`}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Họ và Tên Học Sinh (*)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An"
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Giới Tính
                    </label>
                    <select
                      value={studentGenderInput}
                      onChange={(e) => setStudentGenderInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm font-semibold focus:outline-hidden"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Ngày Sinh
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 15/05/2009"
                      value={studentDobInput}
                      onChange={(e) => setStudentDobInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm font-semibold focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Ghi Chú
                  </label>
                  <input
                    type="text"
                    placeholder="Ghi chú thêm về học sinh..."
                    value={studentNotesInput}
                    onChange={(e) => setStudentNotesInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2 text-sm focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    disabled={isSubmittingStudent}
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setEditingStudent(null);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!!duplicateConflict || isSubmittingStudent}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                      duplicateConflict || isSubmittingStudent
                        ? 'bg-slate-400 dark:bg-slate-700 text-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                    }`}
                  >
                    {isSubmittingStudent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{editingStudent ? 'Đang cập nhật...' : 'Đang thêm...'}</span>
                      </>
                    ) : (
                      <span>{editingStudent ? 'Cập Nhật Thông Tin' : 'Thêm Học Sinh'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal 3: Bulk Import Roster */}
      {showBulkImportModal && currentClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Nhập Danh Sách Học Sinh Hàng Loạt - {currentClass.name}
                </h3>
              </div>
              <button
                disabled={isSubmittingBulk}
                onClick={() => setShowBulkImportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Dán Danh Sách Học Sinh (Mỗi hàng 1 học sinh)
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder={`Ví dụ định dạng 1 (chỉ cần họ tên, tự sinh SBD):
Nguyễn Văn An
Trần Thị Bình
Lê Hoàng Cường

Ví dụ định dạng 2 (kèm SBD):
10A101, Nguyễn Văn An, Nam, 15/05/2009
10A102, Trần Thị Bình, Nữ, 20/08/2009`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Tự động sinh Số Báo Danh (SBD):</strong> Nếu bạn chỉ dán tên học sinh, hệ thống sẽ tự động tạo SBD dạng <code>{currentClass.name.replace(/\s+/g, '').toUpperCase()}01</code>, <code>{currentClass.name.replace(/\s+/g, '').toUpperCase()}02</code>...
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingBulk}
                  onClick={() => setShowBulkImportModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBulk}
                  className={`px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer ${
                    isSubmittingBulk ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmittingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang nhập...</span>
                    </>
                  ) : (
                    <span>Nhập Hàng Loạt</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-2xl ${
                  confirmModal.type === 'delete_class' || confirmModal.type === 'delete_student'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                }`}
              >
                {confirmModal.type === 'delete_class' || confirmModal.type === 'delete_student' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmModal.type === 'reset_attempt' ? (
                  <RotateCcw className="w-6 h-6" />
                ) : (
                  <RefreshCw className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Xác nhận thao tác quản lý danh sách</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                disabled={isProcessingConfirm}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isProcessingConfirm}
                onClick={executeConfirmAction}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-2 cursor-pointer ${
                  confirmModal.type === 'delete_class' || confirmModal.type === 'delete_student'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                } ${isProcessingConfirm ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isProcessingConfirm ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {confirmModal.type === 'delete_class'
                        ? 'Đang xóa lớp...'
                        : confirmModal.type === 'delete_student'
                        ? 'Đang xóa...'
                        : confirmModal.type === 'auto_sbd'
                        ? 'Đang sinh SBD...'
                        : 'Đang xử lý...'}
                    </span>
                  </>
                ) : (
                  <span>{confirmModal.buttonText || 'Đồng ý'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
                : 'bg-rose-950 text-rose-200 border-rose-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
