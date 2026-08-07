import { ExamMetadata } from '../types';

export class PromptEngine {
  /**
   * Tạo System Instruction chuẩn chuyên gia giáo dục Công văn 7991/BGDĐT
   */
  static getSystemInstruction(): string {
    return `Bạn là Chuyên gia Giáo dục Hàng đầu Việt Nam + Chuyên gia Đánh giá Năng lực theo Công văn 7991/BGDĐT của Bộ Giáo dục và Đào tạo.
Nhiệm vụ của bạn là biên soạn ma trận, bảng đặc tả, đề kiểm tra, đáp án và hướng dẫn chấm hoàn chỉnh, chính xác 100% theo chương trình Giáo dục phổ thông (GDPT 2018).

BẮT BUỘC TUÂN THỦ CÁC NGUYÊN TẮC SAU:
1. Nội dung câu hỏi hoàn toàn MỚI, KHÔNG sao chép nguyên văn từ Sách giáo khoa, đảm bảo bám sát Yêu cầu cần đạt (YCCĐ).
2. Chuẩn kiến thức, kỹ năng, vừa sức với thời gian làm bài.
3. Đúng cấu trúc Công văn 7991/BGDĐT:
   - PHẦN I: Trắc nghiệm nhiều phương án lựa chọn (Mỗi câu hỏi có 4 phương án A, B, C, D, chỉ chọn 1 phương án đúng).
   - PHẦN II: Trắc nghiệm Đúng/Sai (Mỗi câu hỏi có 1 lệnh hỏi chính và 4 ý a, b, c, d; ở mỗi ý chọn Đúng hoặc Sai).
   - PHẦN III: Trắc nghiệm Trả lời ngắn (Học sinh điền kết quả ngắn, số hoặc cụm từ).
   - PHẦN IV: Tự luận (Các câu hỏi tự luận bao gồm ĐẦY ĐỦ CẢ 4 MỨC ĐỘ NHẬN THỨC: Nhận biết [NB_TL], Thông hiểu [TH_TL], Vận dụng [VD_TL], Vận dụng cao [VDC_TL] kèm Thang điểm & Rubric chi tiết).
4. Phân bổ đúng tỷ lệ mức độ nhận thức: Nhận biết (REMEMBER / NB), Thông hiểu (UNDERSTAND / TH), Vận dụng (APPLY / VD), Vận dụng cao (ADVANCED / VDC). Với phần Tự luận (Phần IV), BẮT BUỘC phải bao gồm đầy đủ cả 4 mức độ nhận thức này.
5. Tất cả công thức Toán học, Vật lý, Hóa học, ký hiệu ở TẤT CẢ các trường (bao gồm cả 'explanation', 'essayAnswerGuide') BẮT BUỘC phải được bọc chuẩn bằng cặp dấu $...$ (ví dụ: $\Delta' = m^2 - 4 < 0$, $\forall x \in \mathbb{R}$). LƯU Ý QUAN TRỌNG: CHỈ bọc biểu thức toán học, công thức và biến số trong dấu $...$ (ví dụ $x + y = 2$, $m$). TUYỆT ĐỐI KHÔNG bọc cả câu hay cụm từ Tiếng Việt trong dấu $...$ (ví dụ KHÔNG ĐƯỢC viết $Cho hệ phương trình...$ hay $với m là tham số$). ĐẶC BIỆT: HỆ PHƯƠNG TRÌNH bắt buộc dùng môi trường \\begin{cases} ... \\end{cases} và phân cách giữa các phương trình bằng dấu xuống dòng hàng kép '\\\\' (ví dụ: $\\begin{cases} x - 3y = 2 \\\\ -2x + 5y = 1 \\end{cases}$). TUYỆT ĐỐI KHÔNG viết các phương trình của hệ nằm trên cùng một dòng ngang.
6. TRONG CHUỖI JSON TRẢ VỀ, MỌI DẤU GẠCH CHÉO NGƯỢC '\\' CỦA LATEX BẮT BUỘC PHẢI ĐƯỢC ESCAPE THÀNH '\\\\' (VÍ DỤ VIẾT '\\\\frac', '\\\\sqrt', '\\\\alpha', '\\\\begin', VÀ DẤU XUỐNG DÒNG HỆ PHƯƠNG TRÌNH PHẢI VIẾT LÀ '\\\\\\\\' TRONG JSON CHUẨN) ĐỂ JSON KHÔNG BỊ LỖI CÚ PHÁP.
7. Trả về đúng 1 đối tượng JSON duy nhất theo đúng cấu trúc schema được yêu cầu, không có lời mở đầu hay kết luận thừa ngoài JSON.
7. ĐẶC BIỆT DÀNH CHO CÂU HỎI HÌNH HỌC VÀ ĐỒ THỊ HÀM SỐ:
   Nếu bài tập thuộc mạch HÌNH HỌC (hình học không gian, tam giác, hình chóp, lăng trụ, tứ diện, đường tròn, véctơ...) hoặc HÀM SỐ / VẼ ĐỒ THỊ (hàm bậc nhất, bậc hai, bậc ba, hàm nhất biến...):
   - BẮT BUỘC cung cấp chuỗi mã SVG chuẩn, trực quan trong trường "svgDiagram" (cho đề thi) và "solutionDiagramSvg" (cho phần đáp án / hướng dẫn giải chi tiết).
   - Mã SVG phải chứa thẻ <svg viewBox="0 0 400 300" ...>, màu sắc sắc nét, nét vẽ đứt đoạn cho nét khuất hình học (stroke-dasharray="4,4"), và các nhãn tên điểm / trục tọa độ ($A, B, C, D, S, H, Ox, Oy, O...$).`;
  }

  /**
   * Tạo prompt chi tiết từ thông tin giáo viên nhập
   */
  static buildGenerationPrompt(metadata: ExamMetadata): string {
    const {
      schoolName,
      subject,
      grade,
      semester,
      schoolYear,
      examTitle,
      chapterTitle,
      durationMinutes,
      totalPoints,
      curriculum,
      examMode,
      questionCounts,
      cognitiveRatio,
    } = metadata;

    let modeDescription = '';
    if (examMode === 'MCQ_ESSAY') {
      modeDescription = 'Đề kết hợp Trắc nghiệm và Tự luận (Gồm các Phần I, II, III, IV tùy thuộc số lượng câu hỏi khai báo).';
    } else if (examMode === 'MCQ_ONLY') {
      modeDescription = 'Đề Trắc nghiệm 100% (Chỉ gồm Phần I, Phần II, Phần III, KHÔNG có Phần IV Tự luận).';
    } else {
      modeDescription = 'Đề Tự luận 100% (Chỉ gồm Phần IV Tự luận, KHÔNG có các phần Trắc nghiệm I, II, III).';
    }

    let referenceSection = '';
    if (metadata.referenceContext && metadata.referenceContext.trim()) {
      referenceSection += `
⚠️ GIỚI HẠN KIẾN THỨC VÀ NGUỒN TÀI LIỆU CỤ THỂ DO GIÁO VIÊN CUNG CẤP (BẮT BUỘC BÁM SÁT TUYỆT ĐỐI):
${metadata.referenceContext.trim()}

🎯 YÊU CẦU QUAN TRỌNG VỀ PHẠM VI KIẾN THỨC:
1. CHỈ sinh câu hỏi nằm hoàn toàn trong phạm vi nội dung và giới hạn kiến thức được giáo viên mô tả ở trên.
2. TUYỆT ĐỐI KHÔNG đưa vào các dạng toán hay bài học thuộc chương/mục khác không có trong nguồn tài liệu này (Ví dụ: Nếu tài liệu ghi nhận bài học chưa có 'Hằng đẳng thức đáng nhớ' hay 'Phân thức đại số', tuyệt đối KHÔNG được ra câu hỏi liên quan đến hằng đẳng thức hay phân thức đại số).
`;
    }

    if (metadata.referenceImages && metadata.referenceImages.length > 0) {
      referenceSection += `
📸 TÀI LIỆU HÌNH ẢNH / TRANG SÁCH GIÁO KHOA / MỤC LỤC ĐÍNH KÈM:
Đã gửi kèm ${metadata.referenceImages.length} ảnh trang sách giáo khoa / ảnh chụp bài học / mục lục. Hãy phân tích kỹ nội dung trong các bức ảnh này để trích xuất đúng phạm vi bài học và giới hạn câu hỏi chuẩn xác 100%.
`;
    }

    return `
HÃY SINH MA TRẬN, BẢNG ĐẶC TẢ VÀ ĐỀ KIỂM TRA CHUẨN CÔNG VĂN 7991/BGDĐT CHO THÔNG TIN SAU:

📌 THÔNG TIN CHUNG:
- Trường: ${schoolName || 'Trường THPT'}
- Môn học: ${subject}
- Khối lớp: ${grade}
- Học kỳ: ${semester} | Năm học: ${schoolYear}
- Tên kỳ thi / Bài kiểm tra: ${examTitle}
- Tên bài / Chương / Chủ đề: ${chapterTitle}
- Bộ sách giáo khoa: ${curriculum}
- Thời gian làm bài: ${durationMinutes} phút
- Thang điểm tổng: ${totalPoints} điểm
- Chế độ đề: ${modeDescription}
${referenceSection}
📊 CẤU TRÚC SỐ LƯỢNG CÂU HỎI THEO DẠNG VÀ THANG ĐIỂM CHI TIẾT:
- Phần I (Trắc nghiệm 4 lựa chọn): ${questionCounts.part1_MCQSingle} câu (Mỗi câu ${questionCounts.part1_PointsPerQuestion ?? 0.25} điểm)
- Phần II (Trắc nghiệm Đúng/Sai - mỗi câu 4 ý a,b,c,d): ${questionCounts.part2_MCQTrueFalse} câu (Mỗi câu ${questionCounts.part2_PointsPerQuestion ?? 1.0} điểm)
- Phần III (Trắc nghiệm Trả lời ngắn): ${questionCounts.part3_MCQShort} câu (Mỗi câu ${questionCounts.part3_PointsPerQuestion ?? 0.25} điểm)
- Phần IV (Tự luận): ${questionCounts.part4_Essay} câu tự luận.
  * YÊU CẦU PHẦN TỰ LUẬN BẮT BUỘC ĐẦY ĐỦ CẢ 4 MỨC ĐỘ NHẬN THỨC: Nhận biết [NB_TL], Thông hiểu [TH_TL], Vận dụng [VD_TL], Vận dụng cao [VDC_TL].
  * LƯU Ý GÁN ĐIỂM SỐ CÂU TỰ LUẬN: Tổng quỹ điểm tự luận là ${Math.max(0, Math.round((10.0 - ((questionCounts.part1_MCQSingle || 0) * (questionCounts.part1_PointsPerQuestion ?? 0.25) + (questionCounts.part2_MCQTrueFalse || 0) * (questionCounts.part2_PointsPerQuestion ?? 1.0) + (questionCounts.part3_MCQShort || 0) * (questionCounts.part3_PointsPerQuestion ?? 0.25))) * 100) / 100)}đ. KHÔNG chia đều điểm máy móc. Hãy căn cứ độ khó và độ dài từng câu tự luận (NB, TH, VD, VDC) để gán điểm số thích hợp (ví dụ câu NB/TH 0.5đ - 1.0đ, câu VD/VDC 1.5đ - 2.5đ...) sao cho tổng điểm toàn đề đúng 10.0 điểm.

🎯 TỶ LỆ MỨC ĐỘ NHẬN THỨC:
- Nhận biết (REMEMBER): ${cognitiveRatio.remember}%
- Thông hiểu (UNDERSTAND): ${cognitiveRatio.understand}%
- Vận dụng (APPLY): ${cognitiveRatio.apply}%
- Vận dụng cao (ADVANCED): ${cognitiveRatio.advanced}%

YÊU CẦU ĐẦU RA JSON CHÍNH XÁC THEO SCHEMA SAU:
{
  "matrix": [
    {
      "stt": 1,
      "topic": "Tên mạch nội dung/chủ đề",
      "subTopic": "Tên đơn vị kiến thức",
      "part1": { "remember": 2, "understand": 1, "apply": 0, "advanced": 0 },
      "part2": { "remember": 0, "understand": 1, "apply": 0, "advanced": 0 },
      "part3": { "remember": 0, "understand": 0, "apply": 1, "advanced": 0 },
      "part4": { "remember": 0, "understand": 0, "apply": 0, "advanced": 1 },
      "totalQuestions": 5,
      "totalPoints": 3.5,
      "percentage": 35
    }
  ],
  "specification": [
    {
      "stt": 1,
      "topic": "Tên mạch nội dung/chủ đề",
      "subTopic": "Tên đơn vị kiến thức",
      "requirements": "Yêu cầu cần đạt chi tiết...",
      "part1": { "remember": 2, "understand": 1, "apply": 0, "advanced": 0 },
      "part2": { "remember": 0, "understand": 1, "apply": 0, "advanced": 0 },
      "part3": { "remember": 0, "understand": 0, "apply": 1, "advanced": 0 },
      "part4": { "remember": 0, "understand": 0, "apply": 0, "advanced": 1 },
      "totalPoints": 3.5
    }
  ],
  "questions": [
    // Với PHẦN I (Nhiều lựa chọn):
    {
      "id": "q-1",
      "partType": "PART1",
      "partTitle": "PHẦN I. Câu hỏi trắc nghiệm nhiều phương án lựa chọn",
      "number": 1,
      "content": "Nội dung câu hỏi...",
      "cognitiveLevel": "REMEMBER",
      "points": 0.25,
      "topic": "Tên chủ đề",
      "options": [
        { "key": "A", "content": "Phương án A" },
        { "key": "B", "content": "Phương án B" },
        { "key": "C", "content": "Phương án C" },
        { "key": "D", "content": "Phương án D" }
      ],
      "correctOption": "A",
      "explanation": "Giải thích câu 1..."
    },
    // Với PHẦN II (Đúng/Sai):
    {
      "id": "q-2",
      "partType": "PART2",
      "partTitle": "PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai",
      "number": 1,
      "content": "Lệnh hỏi chính cho cả 4 ý...",
      "cognitiveLevel": "UNDERSTAND",
      "points": 1.0,
      "topic": "Tên chủ đề",
      "trueFalseStatements": [
        { "key": "a", "content": "Ý a...", "isCorrect": true },
        { "key": "b", "content": "Ý b...", "isCorrect": false },
        { "key": "c", "content": "Ý c...", "isCorrect": true },
        { "key": "d", "content": "Ý d...", "isCorrect": false }
      ],
      "explanation": "Giải thích chi tiết các ý..."
    },
    // Với PHẦN III (Trả lời ngắn):
    {
      "id": "q-3",
      "partType": "PART3",
      "partTitle": "PHẦN III. Câu hỏi trắc nghiệm trả lời ngắn",
      "number": 1,
      "content": "Nội dung câu hỏi yêu cầu tính ra số/kết quả ngắn...",
      "cognitiveLevel": "APPLY",
      "points": 0.25,
      "topic": "Tên chủ đề",
      "shortAnswer": "Đáp án ngắn (VD: 15 hoặc x = 3)",
      "explanation": "Các bước tính ra kết quả..."
    },
    // Với PHẦN IV (Tự luận):
    {
      "id": "q-4",
      "partType": "PART4",
      "partTitle": "PHẦN IV. Tự luận",
      "number": 1,
      "content": "Nội dung bài tập tự luận...",
      "cognitiveLevel": "ADVANCED",
      "points": 1.5,
      "topic": "Tên chủ đề",
      "essayAnswerGuide": "Hướng dẫn giải chi tiết...",
      "rubric": [
        { "criteria": "Ý 1 / Bước 1", "points": 0.5, "description": "Mô tả bước giải..." },
        { "criteria": "Ý 2 / Bước 2", "points": 1.0, "description": "Mô tả bước giải..." }
      ],
      "explanation": "Lưu ý khi chấm bài..."
    }
  ]
}

Chú ý: Hãy đảm bảo số lượng câu hỏi trong danh sách "questions" khớp CHÍNH XÁC với số lượng khai báo ở trên!

📐 QUY TẮC BẮT BUỘC VỀ TRÌNH BÀY CÔNG THỨC TOÁN VÀ LATEX:
1. BẮT BUỘC BỌC TẤT CẢ công thức toán học, tập hợp, biến số, phép tính trong cặp dấu $...$ (ví dụ: $x$, $y$, $A$, $B = \\{x \\in \\mathbb{N} \\mid 15 \\le x < 28\\}$, $x \\vdots 12$, $4^2 \\cdot 5$, $S = 25 \\cdot 74 + 25 \\cdot 26 - 500$). TUYỆT ĐỐI KHÔNG để bất kỳ lệnh LaTeX hay biểu thức toán nào đứng ngoài cặp dấu $.
2. DÙNG '\\cdot' cho dấu nhân (ví dụ $4^2 \\cdot 5$, $25 \\cdot 74$), DÙNG '\\vdots' cho quan hệ chia hết (ví dụ $x \\vdots 12$ và $x \\vdots 18$), DÙNG '\\mid' cho gạch đứng biểu diễn tập hợp (ví dụ $x \\in \\mathbb{N} \\mid 15 \\le x < 28$), DÙNG '\\le', '\\ge' cho nhỏ hơn/lớn hơn hoặc bằng (ví dụ $8 < x \\le 14$).
3. Với tập hợp số, dùng '\\mathbb{N}', '\\mathbb{Z}', '\\mathbb{Q}', '\\mathbb{R}'. Toàn bộ tên tập hợp và biểu thức tập hợp PHẢI bọc trong dấu $, ví dụ: $A = \\{x \\in \\mathbb{N} \\mid 8 < x \\le 14\\}$.
`;
  }
}
