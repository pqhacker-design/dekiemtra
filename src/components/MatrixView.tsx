import React, { useState } from 'react';
import { Download, Edit3, Grid, Save } from 'lucide-react';
import { ExamPackage, MatrixRow } from '../types';
import { MathText } from './MathText';

interface MatrixViewProps {
  examPackage: ExamPackage | null;
  onUpdateMatrix?: (updatedMatrix: MatrixRow[]) => void;
  onExportWord?: () => void;
  onExportExcel?: () => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  examPackage,
  onUpdateMatrix,
  onExportWord,
  onExportExcel,
}) => {
  if (!examPackage) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Grid className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Chưa Có Dữ Liệu Ma Trận Đề Kiểm Tra
        </h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Vui lòng vào mục "Tạo đề kiểm tra" để hệ thống AI sinh Ma trận đề chuẩn Công văn 7991/BGDĐT.
        </p>
      </div>
    );
  }

  const { metadata, matrix } = examPackage;
  const [isEditing, setIsEditing] = useState(false);
  const [editableMatrix, setEditableMatrix] = useState<MatrixRow[]>(matrix);

  const handleCellChange = (stt: number, field: string, value: any) => {
    setEditableMatrix((prev) =>
      prev.map((row) => (row.stt === stt ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = () => {
    if (onUpdateMatrix) {
      onUpdateMatrix(editableMatrix);
    }
    setIsEditing(false);
  };

  // Tính tổng cộng
  const totalQuestionsSum = editableMatrix.reduce((a, b) => a + Number(b.totalQuestions || 0), 0);
  const totalPointsSum = editableMatrix.reduce((a, b) => a + Number(b.totalPoints || 0), 0);

  const getNum = (part: any, field: string): number => {
    if (!part) return 0;
    return Number(part[field] || 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-900/50 px-2.5 py-0.5 rounded-full text-xs font-bold text-teal-800 dark:text-teal-300">
            <span>MẪU CHUẨN CÔNG VĂN 7991/BGDĐT</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Khung Ma Trận Đề Kiểm Tra - Môn {metadata.subject} ({metadata.grade})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thời gian: {metadata.durationMinutes} phút | Tổng điểm: {metadata.totalPoints} điểm | Bộ sách: {metadata.curriculum}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Chỉnh Sửa</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh Sửa Bảng</span>
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

      {/* Ma Trận Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border border-slate-300 dark:border-slate-700">
          <thead>
            {/* Header Level 1 */}
            <tr className="bg-teal-900 text-white font-bold text-center">
              <th rowSpan={3} className="border border-slate-400 p-2 w-10">T</th>
              <th rowSpan={3} className="border border-slate-400 p-2 min-w-[170px]">Chủ đề / Mạch nội dung</th>
              <th rowSpan={3} className="border border-slate-400 p-2 min-w-[170px]">Đơn vị kiến thức</th>
              <th colSpan={8} className="border border-slate-400 p-2 bg-teal-800">
                Mức độ nhận thức (Số câu hỏi)
              </th>
              <th rowSpan={3} className="border border-slate-400 p-2 w-16">Tổng câu</th>
              <th rowSpan={3} className="border border-slate-400 p-2 w-16">Tổng điểm</th>
              <th rowSpan={3} className="border border-slate-400 p-2 w-16">Tỷ lệ %</th>
            </tr>
            {/* Header Level 2 */}
            <tr className="bg-teal-800 text-teal-100 font-semibold text-center text-[11px]">
              <th colSpan={2} className="border border-slate-400 p-1">Nhận biết</th>
              <th colSpan={2} className="border border-slate-400 p-1">Thông hiểu</th>
              <th colSpan={2} className="border border-slate-400 p-1">Vận dụng</th>
              <th colSpan={2} className="border border-slate-400 p-1">Vận dụng cao</th>
            </tr>
            {/* Header Level 3 */}
            <tr className="bg-teal-700 text-white font-bold text-center text-[10px]">
              <th className="border border-slate-400 p-1 w-8 bg-teal-700">TN</th>
              <th className="border border-slate-400 p-1 w-8 bg-emerald-800">TL</th>
              <th className="border border-slate-400 p-1 w-8 bg-teal-700">TN</th>
              <th className="border border-slate-400 p-1 w-8 bg-emerald-800">TL</th>
              <th className="border border-slate-400 p-1 w-8 bg-teal-700">TN</th>
              <th className="border border-slate-400 p-1 w-8 bg-emerald-800">TL</th>
              <th className="border border-slate-400 p-1 w-8 bg-teal-700">TN</th>
              <th className="border border-slate-400 p-1 w-8 bg-emerald-800">TL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {editableMatrix.map((row) => {
              // Sub-breakdowns: TN (p1+p2+p3) vs TL (p4) per level
              const rem_TN = getNum(row.part1, 'remember') + getNum(row.part2, 'remember') + getNum(row.part3, 'remember');
              const rem_TL = getNum(row.part4, 'remember');

              const und_TN = getNum(row.part1, 'understand') + getNum(row.part2, 'understand') + getNum(row.part3, 'understand');
              const und_TL = getNum(row.part4, 'understand');

              const app_TN = getNum(row.part1, 'apply') + getNum(row.part2, 'apply') + getNum(row.part3, 'apply');
              const app_TL = getNum(row.part4, 'apply');

              const adv_TN = getNum(row.part1, 'advanced') + getNum(row.part2, 'advanced') + getNum(row.part3, 'advanced');
              const adv_TL = getNum(row.part4, 'advanced');

              return (
                <tr key={row.stt} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold">
                    {row.stt}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-2 font-medium">
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
                  <td className="border border-slate-300 dark:border-slate-700 p-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={row.subTopic}
                        onChange={(e) => handleCellChange(row.stt, 'subTopic', e.target.value)}
                        className="w-full bg-amber-50 dark:bg-slate-800 border p-1 rounded-xs"
                      />
                    ) : (
                      <MathText content={row.subTopic} />
                    )}
                  </td>

                  {/* Nhận biết: TN / TL */}
                  <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {rem_TN || '-'}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {rem_TL || '-'}
                  </td>

                  {/* Thông hiểu: TN / TL */}
                  <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {und_TN || '-'}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {und_TL || '-'}
                  </td>

                  {/* Vận dụng: TN / TL */}
                  <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {app_TN || '-'}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {app_TL || '-'}
                  </td>

                  {/* Vận dụng cao: TN / TL */}
                  <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {adv_TN || '-'}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-1.5 text-center font-bold text-slate-800 dark:text-slate-200">
                    {adv_TL || '-'}
                  </td>

                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-black text-slate-900 dark:text-white">
                    {row.totalQuestions}
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-black text-teal-700 dark:text-teal-400">
                    {row.totalPoints}đ
                  </td>
                  <td className="border border-slate-300 dark:border-slate-700 p-2 text-center font-bold">
                    {row.percentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-center text-slate-900 dark:text-white text-xs">
              <td colSpan={3} className="border border-slate-400 p-2 text-left font-bold">TỔNG CỘNG:</td>
              
              {/* Totals for TN & TL per cognitive level */}
              <td className="border border-slate-400 p-1 font-bold">
                {editableMatrix.reduce((a, b) => a + getNum(b.part1, 'remember') + getNum(b.part2, 'remember') + getNum(b.part3, 'remember'), 0)}
              </td>
              <td className="border border-slate-400 p-1 font-bold">
                {editableMatrix.reduce((a, b) => a + getNum(b.part4, 'remember'), 0)}
              </td>

              <td className="border border-slate-400 p-1 font-bold">
                {editableMatrix.reduce((a, b) => a + getNum(b.part1, 'understand') + getNum(b.part2, 'understand') + getNum(b.part3, 'understand'), 0)}
              </td>
              <td className="border border-slate-400 p-1 font-bold">
                {editableMatrix.reduce((a, b) => a + getNum(b.part4, 'understand'), 0)}
              </td>

              <td className="border border-slate-400 p-1 font-bold">
                {editableMatrix.reduce((a, b) => a + getNum(b.part1, 'apply') + getNum(b.part2, 'apply') + getNum(b.part3, 'apply'), 0)}
              </td>
              <td className="border border-slate-400 p-1 font-bold">
                {editableMatrix.reduce((a, b) => a + getNum(b.part4, 'apply'), 0)}
              </td>

              <td className="border border-slate-400 p-1 font-bold">
                {editableMatrix.reduce((a, b) => a + getNum(b.part1, 'advanced') + getNum(b.part2, 'advanced') + getNum(b.part3, 'advanced'), 0)}
              </td>
              <td className="border border-slate-400 p-1 font-bold">
                {editableMatrix.reduce((a, b) => a + getNum(b.part4, 'advanced'), 0)}
              </td>

              <td className="border border-slate-400 p-2 font-black">{totalQuestionsSum} câu</td>
              <td className="border border-slate-400 p-2 text-teal-700 dark:text-teal-400 font-black">{totalPointsSum}đ</td>
              <td className="border border-slate-400 p-2 font-black">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
