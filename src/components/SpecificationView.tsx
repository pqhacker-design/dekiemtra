import React, { useState } from 'react';
import { Download, Edit3, Layers, Save } from 'lucide-react';
import { ExamPackage, SpecRow, getSpecRowQuestionDetails } from '../types';
import { MathText } from './MathText';

interface SpecificationViewProps {
  examPackage: ExamPackage | null;
  onUpdateSpec?: (updatedSpec: SpecRow[]) => void;
  onExportWord?: () => void;
}

export const SpecificationView: React.FC<SpecificationViewProps> = ({
  examPackage,
  onUpdateSpec,
  onExportWord,
}) => {
  if (!examPackage) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Layers className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Chưa Có Dữ Liệu Bảng Đặc Tả Đề Kiểm Tra
        </h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Vui lòng vào mục "Tạo đề kiểm tra" để hệ thống AI sinh Bảng đặc tả Yêu cầu cần đạt chuẩn Công văn 7991/BGDĐT.
        </p>
      </div>
    );
  }

  const { metadata, specification } = examPackage;
  const [isEditing, setIsEditing] = useState(false);
  const [editableSpec, setEditableSpec] = useState<SpecRow[]>(specification);

  const handleCellChange = (stt: number, field: string, value: any) => {
    setEditableSpec((prev) =>
      prev.map((row) => (row.stt === stt ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = () => {
    if (onUpdateSpec) {
      onUpdateSpec(editableSpec);
    }
    setIsEditing(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-900/50 px-2.5 py-0.5 rounded-full text-xs font-bold text-teal-800 dark:text-teal-300">
            <span>BẢNG ĐẶC TẢ YÊU CẦU CẦN ĐẠT - CV 7991/BGDĐT</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Bảng Đặc Tả Đề Kiểm Tra - Môn {metadata.subject} ({metadata.grade})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bám sát Chương trình GDPT 2018 ({metadata.curriculum}) | {metadata.examTitle}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Đặc Tả</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Sửa YCCĐ</span>
            </button>
          )}

          {onExportWord && (
            <button
              onClick={onExportWord}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-teal-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Word</span>
            </button>
          )}
        </div>
      </div>

      {/* Specification Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border border-slate-300 dark:border-slate-700">
          <thead>
            <tr className="bg-teal-900 text-white font-bold text-center">
              <th className="border border-slate-400 p-2 w-12">STT</th>
              <th className="border border-slate-400 p-2 min-w-[180px]">Nội dung / Đơn vị kiến thức</th>
              <th className="border border-slate-400 p-2 min-w-[320px]">Yêu cầu cần đạt (YCCĐ)</th>
              <th className="border border-slate-400 p-2 w-28">Số câu / Dạng câu</th>
              <th className="border border-slate-400 p-2 w-20">Điểm số</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {editableSpec.map((row, idx) => {
              const details = getSpecRowQuestionDetails(
                row,
                idx,
                editableSpec,
                examPackage.exams[0]?.questions || []
              );

              return (
                <tr key={row.stt} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold">
                    {row.stt}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-bold text-teal-800 dark:text-teal-300">
                    {isEditing ? (
                      <input
                        type="text"
                        value={row.topic}
                        onChange={(e) => handleCellChange(row.stt, 'topic', e.target.value)}
                        className="w-full bg-amber-50 dark:bg-slate-800 border p-1 rounded-xs"
                      />
                    ) : (
                      <MathText content={row.topic} />
                    )}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-3 leading-relaxed">
                    {isEditing ? (
                      <textarea
                        value={row.requirements}
                        onChange={(e) => handleCellChange(row.stt, 'requirements', e.target.value)}
                        rows={3}
                        className="w-full bg-amber-50 dark:bg-slate-800 border p-1 rounded-xs text-xs"
                      />
                    ) : (
                      <MathText content={row.requirements} />
                    )}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center space-y-1">
                    {details.length > 0 ? (
                      details.map((detail, dIdx) => (
                        <div key={dIdx} className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {detail}
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400">-</div>
                    )}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-extrabold text-teal-700 dark:text-teal-400">
                    {row.totalPoints} đ
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
