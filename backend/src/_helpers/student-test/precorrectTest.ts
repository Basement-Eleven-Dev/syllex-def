export function precorrectTest({
  questions,
  fitScore,
}: {
  questions: any[];
  fitScore: number;
}): { score: number; fitTestScore: boolean; status: "ai-reviewed" } | null {
  if (!Array.isArray(questions) || typeof fitScore !== "number") return null;
  let score = 0;
  let maxScore = questions.length;
  for (const q of questions) {
    if (q.correct === null) return null;
    if (q.answer === q.correct) score++;
  }
  return {
    score,
    fitTestScore: score >= fitScore,
    status: "ai-reviewed",
  };
}
