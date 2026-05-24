import Groq from "groq-sdk";
import type { BloomsDistribution, BloomsLevel, QuestionObject } from "../types/domain";

function getGroq(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not defined");
  return new Groq({ apiKey });
}

export async function classifyBlooms(questions: QuestionObject[]): Promise<QuestionObject[]> {
  if (questions.length === 0) return questions;

  const groq = getGroq();
  const prompt = `You are a CBSE curriculum expert. Classify each question by Bloom's Taxonomy level.
Levels: Remember, Understand, Apply, Analyze, Evaluate, Create

Questions:
${questions.map((q, i) => `${i + 1}. ${q.text}`).join("\n")}

Respond ONLY with a JSON array of objects:
[{ "index": 1, "level": "Remember" }, { "index": 2, "level": "Apply" }, ...]
No markdown, no extra text.`;

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "[]";
  let classifications: { index: number; level: BloomsLevel }[] = [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      classifications = parsed as { index: number; level: BloomsLevel }[];
    } else if (parsed && typeof parsed === "object" && "classifications" in parsed) {
      classifications = (parsed as { classifications: { index: number; level: BloomsLevel }[] }).classifications;
    }
  } catch {
    classifications = [];
  }

  return questions.map((q, i) => ({
    ...q,
    bloomsLevel: classifications.find((c) => c.index === i + 1)?.level ?? "Remember",
  }));
}

export function computeBloomsDistribution(questions: QuestionObject[]): BloomsDistribution {
  const total = questions.length;
  if (total === 0) {
    return { Remember: 0, Understand: 0, Apply: 0, Analyze: 0, Evaluate: 0, Create: 0, recallPercentage: 0 };
  }

  const counts: Record<BloomsLevel, number> = {
    Remember: 0,
    Understand: 0,
    Apply: 0,
    Analyze: 0,
    Evaluate: 0,
    Create: 0,
  };

  for (const q of questions) {
    const level = q.bloomsLevel ?? "Remember";
    counts[level]++;
  }

  const pct = (n: number) => Math.round((n / total) * 100);

  return {
    Remember: pct(counts.Remember),
    Understand: pct(counts.Understand),
    Apply: pct(counts.Apply),
    Analyze: pct(counts.Analyze),
    Evaluate: pct(counts.Evaluate),
    Create: pct(counts.Create),
    recallPercentage: pct(counts.Remember + counts.Understand),
  };
}

export async function refineQuestionToBloomsLevel(
  question: QuestionObject,
  targetLevel: BloomsLevel,
  sectionContext: string
): Promise<QuestionObject> {
  const groq = getGroq();

  const prompt = `You are rewriting a single exam question for a CBSE paper.
Section context: ${sectionContext}
Original question: ${question.text}
Original difficulty: ${question.difficulty}, Marks: ${question.marks}
Teacher instruction: Rewrite this as a higher-order thinking question targeting ${targetLevel} level of Bloom's Taxonomy

Respond ONLY with valid JSON matching this exact schema:
{
  "text": "rewritten question text",
  "difficulty": "Easy|Moderate|Challenging",
  "marks": ${question.marks},
  "type": "${question.type}",
  "changeReason": "one sentence explaining what changed"
}
Do not include markdown, backticks, or any text outside the JSON.`;

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { text: string; difficulty: "Easy" | "Moderate" | "Challenging"; marks: number; type: string };

  return {
    ...question,
    text: parsed.text ?? question.text,
    difficulty: parsed.difficulty ?? question.difficulty,
    bloomsLevel: targetLevel,
  };
}
