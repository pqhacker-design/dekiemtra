import React, { useState } from 'react';
import {
  BookOpen,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { QuestionBankItem, SubjectType } from '../types';
import { MathText } from './MathText';
import { QuestionDetailCard } from './QuestionDetailCard';

interface QuestionBankViewProps {
  questionBank: QuestionBankItem[];
  onAddQuestion: (item: QuestionBankItem) => void;
  onDeleteQuestion: (id: string) => void;
  onExportExcel?: () => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questionBank,
  onAddQuestion,
  onDeleteQuestion,
  onExportExcel,
}) => {
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedCognitive, setSelectedCognitive] = useState<string>('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState<SubjectType>('Toán');
  const [newGrade, setNewGrade] = useState('Khối 10');
  const [newChapter, setNewChapter] = useState('Chương I. Hàm số');
  const [newCognitive, setNewCognitive] = useState<'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ADVANCED'>('REMEMBER');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [newCorrectOpt, setNewCorrectOpt] = useState('A');

  // Filtered List
  const filteredList = questionBank.filter((item) => {
    const matchesSearch =
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.chapter && item.chapter.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'ALL' || item.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'ALL' || item.grade === selectedGrade;
    const matchesCognitive =
      selectedCognitive === 'ALL' || item.cognitiveLevel === selectedCognitive;

    return matchesSearch && matchesSubject && matchesGrade && matchesCognitive;
  });

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent) return;

    const newItem: QuestionBankItem = {
      id: 'qb_' + Date.now(),
      subject: newSubject,
      grade: newGrade,
      chapter: newChapter,
      curriculum: 'Kết nối tri thức với cuộc sống',
      partType: 'PART1',
      partTitle: 'PHẦN I',
      number: 1,
      content: newContent,
      cognitiveLevel: newCognitive,
      points: 0.25,
      topic: newChapter,
      options: [
        { key: 'A', content: newOptA || 'Phương án A' },
        { key: 'B', content: newOptB || 'Phương án B' },
        { key: 'C', content: newOptC || 'Phương án C' },
        { key: 'D', content: newOptD || 'Phương án D' },
      ],
      correctOption: newCorrectOpt,
      createdDate: new Date().toISOString(),
    };

    onAddQuestion(newItem);
    setShowAddModal(false);
    setNewContent('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-800 dark:text-amber-300">
            <span>KHO DỮ LIỆU CÂU HỎI TỰ ĐỘNG</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Ngân Hàng Câu Hỏi Dùng Chung ({questionBank.length} câu)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động tích lũy các câu hỏi đã sinh từ Gemini AI và cho phép giáo viên tự thêm, lọc, quản lý câu hỏi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Câu Hỏi Thủ Công</span>
          </button>

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung câu hỏi..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>

        {/* Subject Filter */}
        <div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">Tất cả môn học</option>
            <option value="Toán">Toán</option>
            <option value="Ngữ văn">Ngữ văn</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
            <option value="KHTN">KHTN</option>
            <option value="Lịch sử và Địa lí">Lịch sử và Địa lí</option>
          </select>
        </div>

        {/* Grade Filter */}
        <div>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">Tất cả khối lớp</option>
            <option value="Khối 6">Khối 6</option>
            <option value="Khối 7">Khối 7</option>
            <option value="Khối 8">Khối 8</option>
            <option value="Khối 9">Khối 9</option>
            <option value="Khối 10">Khối 10</option>
            <option value="Khối 11">Khối 11</option>
            <option value="Khối 12">Khối 12</option>
          </select>
        </div>

        {/* Cognitive Filter */}
        <div>
          <select
            value={selectedCognitive}
            onChange={(e) => setSelectedCognitive(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="REMEMBER">Nhận biết</option>
            <option value="UNDERSTAND">Thông hiểu</option>
            <option value="APPLY">Vận dụng</option>
            <option value="ADVANCED">Vận dụng cao</option>
          </select>
        </div>
      </div>

      {/* Question Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Không tìm thấy câu hỏi nào phù hợp với bộ lọc
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((item, idx) => (
            <QuestionDetailCard
              key={item.id}
              question={item}
              questionNumber={idx + 1}
              showAnswers={true}
              showExplanation={true}
              defaultExpandedExplanation={false}
              badgeExtra={
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {item.subject} - {item.grade} {item.chapter ? `(${item.chapter})` : ''}
                </span>
              }
              actions={
                <button
                  onClick={() => setDeletingQuestionId(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors cursor-pointer"
                  title="Xóa câu hỏi khỏi ngân hàng"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              }
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Xác Nhận Xóa Câu Hỏi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng câu hỏi dùng chung không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingQuestionId(null)}
                className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteQuestion(deletingQuestionId);
                  setDeletingQuestionId(null);
                }}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Xóa Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Question */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white border-b pb-3">
              Thêm Câu Hỏi Mới Vào Ngân Hàng
            </h3>

            <form onSubmit={handleCreateNew} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Môn học</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as SubjectType)}
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="KHTN">KHTN</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Khối lớp</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="Khối 6">Khối 6</option>
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Mức độ nhận thức</label>
                <select
                  value={newCognitive}
                  onChange={(e) => setNewCognitive(e.target.value as any)}
                  className="w-full p-2 border rounded-xl font-bold text-teal-700"
                >
                  <option value="REMEMBER">NHẬN BIẾT</option>
                  <option value="UNDERSTAND">THÔNG HIỂU</option>
                  <option value="APPLY">VẬN DỤNG</option>
                  <option value="ADVANCED">VẬN DỤNG CAO</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Tên bài / Chương</label>
                <input
                  type="text"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Nội dung câu hỏi (Có thể dùng công thức $...$)</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-xl font-medium"
                  required
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <label className="font-semibold block">4 Phương án trả lời & Chọn đáp án đúng:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Phương án A"
                    value={newOptA}
                    onChange={(e) => setNewOptA(e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Phương án B"
                    value={newOptB}
                    onChange={(e) => setNewOptB(e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Phương án C"
                    value={newOptC}
                    onChange={(e) => setNewOptC(e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Phương án D"
                    value={newOptD}
                    onChange={(e) => setNewOptD(e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <span className="font-bold">Đáp án đúng:</span>
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setNewCorrectOpt(opt)}
                      className={`px-3 py-1 rounded-lg font-bold ${
                        newCorrectOpt === opt ? 'bg-teal-600 text-white' : 'bg-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold"
                >
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
