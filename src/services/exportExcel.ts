import * as XLSX from 'xlsx';
import { ExamPackage, QuestionBankItem, getSpecRowQuestionDetails } from '../types';
import { cleanLatexForDocx } from './exportDocx';

export class ExportExcel {
  /**
   * Xuất gói đề thi (Ma trận, Đặc tả, Bảng Đáp án) ra Workbook Excel (.xlsx)
   */
  static exportExamPackageToExcel(examPack: ExamPackage): void {
    const wb = XLSX.utils.book_new();
    const { metadata, matrix, specification, answerKeys } = examPack;

    // --- SHEET 1: MA TRẬN ĐỀ KIỂM TRA ---
    const matrixData = matrix.map((row) => {
      const getNum = (part: any, field: string): number => (part && part[field]) ? Number(part[field]) : 0;

      return {
        STT: row.stt,
        'Chủ đề / Mạch nội dung': cleanLatexForDocx(row.topic),
        'Đơn vị kiến thức': cleanLatexForDocx(row.subTopic),
        'Nhận biết (TN)': getNum(row.part1, 'remember') + getNum(row.part2, 'remember') + getNum(row.part3, 'remember'),
        'Nhận biết (TL)': getNum(row.part4, 'remember'),
        'Thông hiểu (TN)': getNum(row.part1, 'understand') + getNum(row.part2, 'understand') + getNum(row.part3, 'understand'),
        'Thông hiểu (TL)': getNum(row.part4, 'understand'),
        'Vận dụng (TN)': getNum(row.part1, 'apply') + getNum(row.part2, 'apply') + getNum(row.part3, 'apply'),
        'Vận dụng (TL)': getNum(row.part4, 'apply'),
        'Vận dụng cao (TN)': getNum(row.part1, 'advanced') + getNum(row.part2, 'advanced') + getNum(row.part3, 'advanced'),
        'Vận dụng cao (TL)': getNum(row.part4, 'advanced'),
        'Phần I (4 lựa chọn)': Object.values(row.part1).reduce((a, b) => a + Number(b || 0), 0),
        'Phần II (Đúng/Sai)': Object.values(row.part2).reduce((a, b) => a + Number(b || 0), 0),
        'Phần III (Trả lời ngắn)': Object.values(row.part3).reduce((a, b) => a + Number(b || 0), 0),
        'Phần IV (Tự luận)': Object.values(row.part4).reduce((a, b) => a + Number(b || 0), 0),
        'Tổng số câu': row.totalQuestions,
        'Tổng điểm': row.totalPoints,
        'Tỷ lệ %': `${row.percentage}%`,
      };
    });

    const wsMatrix = XLSX.utils.json_to_sheet(matrixData);
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Ma trận đề');

    // --- SHEET 2: BẢNG ĐẶC TẢ ---
    const primaryQuestions = examPack.exams[0]?.questions || [];
    const specData = specification.map((row, rowIdx) => {
      const details = getSpecRowQuestionDetails(row, rowIdx, specification, primaryQuestions);
      return {
        STT: row.stt,
        'Chủ đề / Đơn vị kiến thức': cleanLatexForDocx(row.topic),
        'Yêu cầu cần đạt': cleanLatexForDocx(row.requirements),
        'Số câu / Dạng câu': details.join('; '),
        'Điểm số': row.totalPoints,
      };
    });

    const wsSpec = XLSX.utils.json_to_sheet(specData);
    XLSX.utils.book_append_sheet(wb, wsSpec, 'Bảng đặc tả');

    // --- SHEET 3: BẢNG ĐÁP ÁN TỔNG HỢP CÁC MÃ ĐỀ ---
    const answersData: any[] = [];

    answerKeys.forEach((ak) => {
      ak.part1Answers.forEach((p1) => {
        answersData.push({
          'Mã đề': ak.code,
          'Phần': 'Phần I (TN 4 lựa chọn)',
          'Câu số': p1.questionNumber,
          'Đáp án': p1.correctOption,
          'Điểm': p1.points,
        });
      });

      ak.part2Answers.forEach((p2) => {
        const formatted = p2.statements
          .map((s) => `${s.key}:${s.isCorrect ? 'Đ' : 'S'}`)
          .join(', ');
        answersData.push({
          'Mã đề': ak.code,
          'Phần': 'Phần II (TN Đúng/Sai)',
          'Câu số': p2.questionNumber,
          'Đáp án': formatted,
          'Điểm': p2.points,
        });
      });

      ak.part3Answers.forEach((p3) => {
        answersData.push({
          'Mã đề': ak.code,
          'Phần': 'Phần III (TN Trả lời ngắn)',
          'Câu số': p3.questionNumber,
          'Đáp án': cleanLatexForDocx(p3.shortAnswer),
          'Điểm': p3.points,
        });
      });

      ak.part4Answers.forEach((p4) => {
        answersData.push({
          'Mã đề': ak.code,
          'Phần': 'Phần IV (Tự luận)',
          'Câu số': p4.questionNumber,
          'Đáp án': cleanLatexForDocx(p4.essayAnswerGuide),
          'Điểm': p4.points,
        });
      });
    });

    const wsAnswers = XLSX.utils.json_to_sheet(answersData);
    XLSX.utils.book_append_sheet(wb, wsAnswers, 'Bảng đáp án');

    const fileName = `Thong_Ke_De_${metadata.subject}_${metadata.grade}_7991.xlsx`;
    this.saveWorkbook(wb, fileName);
  }

  static exportAnswerKeysToExcel(examPack: ExamPackage): void {
    this.exportExamPackageToExcel(examPack);
  }

  /**
   * Xuất Ngân hàng câu hỏi ra file Excel
   */
  static exportQuestionBankToExcel(questions: QuestionBankItem[]): void {
    const wb = XLSX.utils.book_new();

    const qbData = questions.map((q, idx) => ({
      STT: idx + 1,
      ID: q.id,
      'Môn học': q.subject,
      'Khối lớp': q.grade,
      Chương: q.chapter,
      'Bộ sách': q.curriculum,
      'Dạng câu hỏi': q.partType,
      'Mức độ': q.cognitiveLevel,
      'Nội dung câu hỏi': cleanLatexForDocx(q.content),
      'Đáp án':
        q.partType === 'PART1'
          ? q.correctOption
          : q.partType === 'PART2'
          ? q.trueFalseStatements?.map((s) => `${s.key}:${s.isCorrect ? 'Đ' : 'S'}`).join('; ')
          : q.partType === 'PART3'
          ? cleanLatexForDocx(q.shortAnswer || '')
          : cleanLatexForDocx(q.essayAnswerGuide || ''),
      'Lời giải chi tiết': cleanLatexForDocx(q.explanation || ''),
      'Ngày tạo': q.createdDate,
    }));

    const wsQB = XLSX.utils.json_to_sheet(qbData);
    XLSX.utils.book_append_sheet(wb, wsQB, 'Ngân hàng câu hỏi');

    this.saveWorkbook(wb, `Ngan_Hang_Cau_Hoi_AI_Test_${Date.now()}.xlsx`);
  }

  /**
   * Xuất danh sách học sinh theo Lớp ra file Excel (.xlsx)
   */
  static exportStudentListToExcel(students: any[], className: string): void {
    const data = students.map((s, idx) => ({
      STT: idx + 1,
      'Số Báo Danh (SBD)': s.sbd,
      'Họ và Tên Học Sinh': s.name,
      'Lớp': s.className,
      'Khối': s.grade || '',
      'Trường': s.school || '',
      'Ghi Chú': s.notes || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, `Danh sach HS Loph ${className}`);
    
    const fileName = `Danh_Sach_Hoc_Sinh_Lop_${className.replace(/\s+/g, '_')}.xlsx`;
    this.saveWorkbook(wb, fileName);
  }

  private static saveWorkbook(wb: XLSX.WorkBook, fileName: string): void {
    try {
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      // Fallback cho trình duyệt / iFrame
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    }
  }
}
