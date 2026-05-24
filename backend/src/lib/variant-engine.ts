import type { PaperVariant, QuestionObject, SectionObject } from "../types/domain";

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function mutateNumericals(text: string, seed: number): string {
  const deltas = [2, 3, 5, -2, -3];
  return text.replace(/\b(\d{2,3})\b/g, (match, num) => {
    const n = parseInt(num, 10);
    const delta = deltas[seed % 5];
    const result = n + delta;
    return result > 0 ? String(result) : match;
  });
}

function shuffleMCQOptions(q: QuestionObject): QuestionObject {
  if (q.type.toLowerCase().includes("multiple choice") && q.options && q.options.length > 0) {
    return { ...q, options: fisherYatesShuffle([...q.options]) };
  }
  return q;
}

export interface VariantConfig {
  count: number;
  shuffleQuestions: boolean;
  shuffleMCQOptions: boolean;
  mutateNumericals: boolean;
  addQRWatermark: boolean;
}

export function generateVariant(
  assignmentId: string,
  sections: SectionObject[],
  variantIndex: number,
  config: VariantConfig
): PaperVariant {
  const label = String.fromCharCode(65 + variantIndex);
  const variantId = `${assignmentId}-variant-${label}`;

  const processedSections = sections.map((section) => {
    let questions: QuestionObject[] = [...section.questions];

    if (config.shuffleQuestions) {
      questions = fisherYatesShuffle(questions);
    }

    if (config.shuffleMCQOptions) {
      questions = questions.map(shuffleMCQOptions);
    }

    if (config.mutateNumericals) {
      questions = questions.map((q) => ({
        ...q,
        text: mutateNumericals(q.text, variantIndex),
      }));
    }

    let num = section.questions[0]?.number ?? 1;
    questions = questions.map((q) => ({ ...q, number: num++ }));

    return { ...section, questions };
  });

  return {
    variantId,
    label,
    assignmentId,
    sections: processedSections,
    qrPayload: config.addQRWatermark
      ? JSON.stringify({ variantId, label, examId: assignmentId })
      : null,
    createdAt: new Date(),
  };
}

export function generateAllVariants(
  assignmentId: string,
  sections: SectionObject[],
  config: VariantConfig
): PaperVariant[] {
  return Array.from({ length: config.count }, (_, i) =>
    generateVariant(assignmentId, sections, i, config)
  );
}
