import { CodeExam, ExamAnswerKey, Question, QuestionCounts } from '../types';

/**
 * Fisher-Yates Shuffle helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class ShuffleEngine {
  /**
   * Sinh danh sách các mã đề và bảng đáp án tương ứng từ đề gốc (Mã 101)
   */
  static generateMultipleExamCodes(
    baseQuestions: Question[],
    codeCount: number = 1
  ): { exams: CodeExam[]; answerKeys: ExamAnswerKey[] } {
    const exams: CodeExam[] = [];
    const answerKeys: ExamAnswerKey[] = [];

    // Phân loại các phần
    const part1List = baseQuestions.filter((q) => q.partType === 'PART1');
    const part2List = baseQuestions.filter((q) => q.partType === 'PART2');
    const part3List = baseQuestions.filter((q) => q.partType === 'PART3');
    const part4List = baseQuestions.filter((q) => q.partType === 'PART4');

    for (let index = 0; index < codeCount; index++) {
      // Mã đề: 101, 102, 103, ...
      const codeNumber = 101 + index;
      const examCodeStr = codeNumber.toString();

      let currentPart1 = [...part1List];
      let currentPart2 = [...part2List];
      let currentPart3 = [...part3List];
      let currentPart4 = [...part4List];

      // Đề gốc 101 giữ nguyên order, từ mã 102 trở đi thực hiện đảo
      if (index > 0) {
        currentPart1 = shuffleArray(currentPart1);
        currentPart2 = shuffleArray(currentPart2);
        currentPart3 = shuffleArray(currentPart3);
        currentPart4 = shuffleArray(currentPart4);
      }

      const finalQuestionsForCode: Question[] = [];

      // 1. Xử lý PHẦN I: Trắc nghiệm 4 phương án
      const processedPart1 = currentPart1.map((origQ, qIdx) => {
        const questionNumber = qIdx + 1;
        let newOptions = origQ.options ? [...origQ.options] : [];
        let newCorrectOption = origQ.correctOption || 'A';

        if (index > 0 && newOptions.length === 4) {
          // Lấy nội dung phương án đúng cũ
          const oldCorrectContent = newOptions.find(
            (o) => o.key === origQ.correctOption
          )?.content;

          // Xáo trộn phương án
          const shuffledContents = shuffleArray(newOptions.map((o) => o.content));
          const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

          newOptions = keys.map((k, i) => ({
            key: k,
            content: shuffledContents[i],
          }));

          // Xác định key mới của phương án đúng
          if (oldCorrectContent) {
            const foundNew = newOptions.find((o) => o.content === oldCorrectContent);
            if (foundNew) {
              newCorrectOption = foundNew.key;
            }
          }
        }

        return {
          ...origQ,
          id: `${origQ.id}-c${examCodeStr}-q${questionNumber}`,
          number: questionNumber,
          options: newOptions,
          correctOption: newCorrectOption,
        };
      });
      finalQuestionsForCode.push(...processedPart1);

      // 2. Xử lý PHẦN II: Trắc nghiệm Đúng/Sai
      const processedPart2 = currentPart2.map((origQ, qIdx) => {
        const questionNumber = qIdx + 1;
        let newStatements = origQ.trueFalseStatements
          ? [...origQ.trueFalseStatements]
          : [];

        if (index > 0 && newStatements.length === 4) {
          const shuffledItems = shuffleArray(newStatements);
          const keys: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];
          newStatements = keys.map((k, i) => ({
            key: k,
            content: shuffledItems[i].content,
            isCorrect: shuffledItems[i].isCorrect,
          }));
        }

        return {
          ...origQ,
          id: `${origQ.id}-c${examCodeStr}-q${questionNumber}`,
          number: questionNumber,
          trueFalseStatements: newStatements,
        };
      });
      finalQuestionsForCode.push(...processedPart2);

      // 3. Xử lý PHẦN III: Trắc nghiệm Trả lời ngắn
      const processedPart3 = currentPart3.map((origQ, qIdx) => {
        const questionNumber = qIdx + 1;
        return {
          ...origQ,
          id: `${origQ.id}-c${examCodeStr}-q${questionNumber}`,
          number: questionNumber,
        };
      });
      finalQuestionsForCode.push(...processedPart3);

      // 4. Xử lý PHẦN IV: Tự luận
      const processedPart4 = currentPart4.map((origQ, qIdx) => {
        const questionNumber = qIdx + 1;
        return {
          ...origQ,
          id: `${origQ.id}-c${examCodeStr}-q${questionNumber}`,
          number: questionNumber,
        };
      });
      finalQuestionsForCode.push(...processedPart4);

      exams.push({
        code: examCodeStr,
        questions: finalQuestionsForCode,
      });

      // Tạo Đáp án tương ứng cho mã đề này
      const answerKey: ExamAnswerKey = {
        code: examCodeStr,
        part1Answers: processedPart1.map((q) => ({
          questionNumber: q.number,
          correctOption: q.correctOption || 'A',
          points: q.points || 0.25,
        })),
        part2Answers: processedPart2.map((q) => ({
          questionNumber: q.number,
          statements: (q.trueFalseStatements || []).map((s) => ({
            key: s.key,
            isCorrect: s.isCorrect,
          })),
          points: q.points || 1.0,
        })),
        part3Answers: processedPart3.map((q) => ({
          questionNumber: q.number,
          shortAnswer: q.shortAnswer || '',
          points: q.points || 0.25,
        })),
        part4Answers: processedPart4.map((q) => ({
          questionNumber: q.number,
          essayAnswerGuide: q.essayAnswerGuide || '',
          points: q.points || 1.0,
          rubric: q.rubric,
        })),
      };

      answerKeys.push(answerKey);
    }

    return { exams, answerKeys };
  }
}
