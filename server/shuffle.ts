// Seeded PRNG and Paper Shuffling Engine for Online Exams

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function createPRNG(seedValue: number | string) {
  let seed = typeof seedValue === 'number' ? seedValue : stringToSeed(seedValue);
  if (seed === 0) seed = 12345;
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(arr: T[], random: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export interface ShuffledPaperResult {
  questions: any[];
  correctAnswerMap: Record<string, any>; // questionId -> correctAnswer / trueFalseMap
}

export function generateShuffledExamPaper(
  examPackage: any,
  seed: string,
  options: { shuffleQuestions: boolean; shuffleOptions: boolean }
): ShuffledPaperResult {
  const random = createPRNG(seed);
  const originalQuestions: any[] = examPackage.exams?.[0]?.questions || [];

  if (originalQuestions.length === 0) {
    return { questions: [], correctAnswerMap: {} };
  }

  // Group questions by partType to maintain structure or shuffle within parts
  const part1 = originalQuestions.filter((q) => q.partType === 'PART1' || !q.partType);
  const part2 = originalQuestions.filter((q) => q.partType === 'PART2');
  const part3 = originalQuestions.filter((q) => q.partType === 'PART3');
  const part4 = originalQuestions.filter((q) => q.partType === 'PART4');

  const p1Shuffled = options.shuffleQuestions ? shuffleArray(part1, random) : [...part1];
  const p2Shuffled = options.shuffleQuestions ? shuffleArray(part2, random) : [...part2];
  const p3Shuffled = options.shuffleQuestions ? shuffleArray(part3, random) : [...part3];
  const p4Shuffled = options.shuffleQuestions ? shuffleArray(part4, random) : [...part4];

  const shuffledQuestionsRaw = [...p1Shuffled, ...p2Shuffled, ...p3Shuffled, ...p4Shuffled];

  const finalQuestions: any[] = [];
  const correctAnswerMap: Record<string, any> = {};

  let displayQuestionNumber = 1;

  for (const q of shuffledQuestionsRaw) {
    const clonedQ = JSON.parse(JSON.stringify(q));
    clonedQ.number = displayQuestionNumber++;

    if (clonedQ.partType === 'PART1' || !clonedQ.partType) {
      const origCorrectKey = clonedQ.correctOption || clonedQ.correctAnswer || 'A';

      if (options.shuffleOptions && Array.isArray(clonedQ.options) && clonedQ.options.length > 0) {
        // Track original correct option content
        const origCorrectOption = clonedQ.options.find((opt: any) => opt.key === origCorrectKey);
        const origCorrectContent = origCorrectOption ? origCorrectOption.content : null;

        // Shuffle options array
        const optionsShuffled = shuffleArray(clonedQ.options, random);

        // Standard option keys A, B, C, D...
        const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
        let newCorrectKey = origCorrectKey;

        clonedQ.options = optionsShuffled.map((opt: any, idx: number) => {
          const newKey = keys[idx] || opt.key;
          if (origCorrectContent && opt.content === origCorrectContent) {
            newCorrectKey = newKey;
          }
          return {
            ...opt,
            key: newKey,
          };
        });

        clonedQ.correctOption = newCorrectKey;
        clonedQ.correctAnswer = newCorrectKey;
        correctAnswerMap[clonedQ.id] = newCorrectKey;
      } else {
        clonedQ.correctOption = origCorrectKey;
        clonedQ.correctAnswer = origCorrectKey;
        correctAnswerMap[clonedQ.id] = origCorrectKey;
      }
    } else if (clonedQ.partType === 'PART2') {
      // Part 2 True/False statements
      const tfMap: Record<string, boolean> = {};
      if (Array.isArray(clonedQ.trueFalseStatements) && clonedQ.trueFalseStatements.length > 0) {
        let statementsToShuffle = [...clonedQ.trueFalseStatements];
        if (options.shuffleOptions) {
          statementsToShuffle = shuffleArray(statementsToShuffle, random);
        }
        const statementKeys = ['a', 'b', 'c', 'd', 'e', 'f'];
        clonedQ.trueFalseStatements = statementsToShuffle.map((st: any, idx: number) => {
          const isCorrectBool = st.isCorrect !== undefined ? !!st.isCorrect : !!st.isTrue;
          const newKey = statementKeys[idx] || st.key;
          tfMap[newKey] = isCorrectBool;
          return {
            ...st,
            key: newKey,
            isCorrect: isCorrectBool,
          };
        });
      }
      correctAnswerMap[clonedQ.id] = tfMap;
    } else if (clonedQ.partType === 'PART3') {
      // Short Answer
      const key = clonedQ.shortAnswer || clonedQ.correctAnswer || clonedQ.correctOption || '';
      clonedQ.shortAnswer = key;
      clonedQ.correctAnswer = key;
      correctAnswerMap[clonedQ.id] = key;
    } else if (clonedQ.partType === 'PART4') {
      // Essay
      const essayGuide = clonedQ.essayAnswerGuide || clonedQ.explanation || '';
      clonedQ.essayAnswerGuide = essayGuide;
      correctAnswerMap[clonedQ.id] = {
        essayAnswerGuide: essayGuide,
        rubric: clonedQ.rubric || [],
        points: clonedQ.points || 1.0,
      };
    }

    finalQuestions.push(clonedQ);
  }

  return {
    questions: finalQuestions,
    correctAnswerMap,
  };
}
