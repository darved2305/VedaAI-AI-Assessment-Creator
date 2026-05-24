import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import type { IAssignment } from "../models/Assignment";
import type { ISection } from "../models/Paper";

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not defined in environment variables");
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export interface GeneratedPaperData {
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
  answerKey: string[];
  message: string;
}

async function extractTextFromFile(fileUrl: string): Promise<string | null> {
  try {
    if (!fileUrl) return null;

    const filename = path.basename(fileUrl);
    const filePath = path.join(process.cwd(), "uploads", filename);

    if (!fs.existsSync(filePath)) return null;

    const fileBuffer = fs.readFileSync(filePath);

    // Detect PDF by magic bytes (%PDF)
    const magic = fileBuffer.subarray(0, 4).toString("ascii");
    if (magic === "%PDF") {
      // pdf-parse v2 uses ESM default export; handle both CJS and ESM interop
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParseModule = require("pdf-parse");
      const pdfParseFn: (buf: Buffer) => Promise<{ text: string }> =
        typeof pdfParseModule === "function"
          ? pdfParseModule
          : (pdfParseModule.default ?? pdfParseModule);
      const data = await pdfParseFn(fileBuffer);
      const text = data.text?.trim();
      if (!text) return null;
      return text.slice(0, 10000);
    }

    return null;
  } catch (err) {
    console.warn("File extraction failed:", (err as Error).message);
    return null;
  }
}

function inferTimeAllowed(totalMarks: number): string {
  if (totalMarks <= 20) return "45 minutes";
  if (totalMarks <= 40) return "1 hour 30 minutes";
  if (totalMarks <= 60) return "2 hours";
  if (totalMarks <= 80) return "2 hours 30 minutes";
  return "3 hours";
}

function buildSystemPrompt(): string {
  return `You are an expert CBSE school examination paper setter with 20+ years of experience designing high-quality question papers for Classes 1–12. You follow NCERT curriculum guidelines precisely.

Your question papers must:
1. Be pedagogically sound and curriculum-aligned
2. Follow CBSE marking schemes and examination patterns
3. Use Bloom's Taxonomy for difficulty classification:
   - Easy: Recall/Comprehension (straightforward knowledge-based questions)
   - Moderate: Application/Analysis (requires understanding and application)
   - Challenging: Evaluation/Synthesis (higher-order thinking, multi-step problems)
4. Have clear, unambiguous question language
5. Cover diverse topics within the subject
6. Be appropriate for the inferred grade level

ALWAYS respond with valid JSON only. No markdown, no code blocks, no extra text.`;
}

function buildUserPrompt(assignment: IAssignment, extractedContent: string | null): string {
  const questionBreakdown = assignment.questionTypes
    .map((q) => `  • ${q.numQuestions}x ${q.type} — ${q.marks} mark${q.marks > 1 ? "s" : ""} each (subtotal: ${q.numQuestions * q.marks})`)
    .join("\n");

  const totalMarks = assignment.questionTypes.reduce(
    (sum, q) => sum + q.numQuestions * q.marks,
    0
  );

  const timeAllowed = inferTimeAllowed(totalMarks);

  const hasContent = !!extractedContent;
  const contentSection = hasContent
    ? `\nSOURCE MATERIAL (questions MUST be based on this content):\n"""\n${extractedContent}\n"""\n`
    : "";

  const instructionsSection = assignment.instructions
    ? `\nTEACHER'S INSTRUCTIONS:\n${assignment.instructions}\n`
    : "";

  return `Create a complete CBSE question paper with the following specifications:

PAPER STRUCTURE:
${questionBreakdown}
• Total Marks: ${totalMarks}
• Recommended Duration: ${timeAllowed}
• Due Date: ${assignment.dueDate}
${instructionsSection}${contentSection}
GENERATION RULES:
${hasContent
    ? "- All questions MUST be directly based on the provided source material\n- Extract key concepts, facts, and topics from the content\n- Ensure comprehensive coverage of the material"
    : "- Generate subject-appropriate CBSE curriculum questions\n- Infer subject and class from teacher's instructions\n- Cover standard NCERT topics for the inferred subject/class"
  }
- Group all questions of the same type into one section (Section A, B, C...)
- Number questions sequentially from 1 across ALL sections
- MCQ options must use format: "A. ...", "B. ...", "C. ...", "D. ..."
- Non-MCQ questions have empty options array []
- Each question must have a difficulty: "Easy", "Moderate", or "Challenging"
- Distribute difficulty: roughly 40% Easy, 40% Moderate, 20% Challenging
- Section instructions must be clear and follow CBSE format
- Answer key must have exactly one entry per question (numbered in order)
- For MCQs, answer key entry should be the full option, e.g. "A. Photosynthesis"
- For short/long questions, provide a concise model answer

Return a single JSON object with this exact structure:
{
  "subject": "inferred subject name",
  "className": "inferred class, e.g. '8th', '10th', 'Class 5'",
  "timeAllowed": "${timeAllowed}",
  "maxMarks": ${totalMarks},
  "message": "Certainly! Here is your customized Question Paper for [Subject] – [Class]. The paper has been crafted based on [content source / specified topics] and covers [brief topic summary].",
  "sections": [
    {
      "label": "Section A",
      "instruction": "Multiple Choice Questions\\nAttempt all questions. Each question carries [X] mark(s).",
      "questions": [
        {
          "number": 1,
          "text": "question text here",
          "difficulty": "Easy",
          "marks": 1,
          "type": "Multiple Choice Questions",
          "options": ["A. option1", "B. option2", "C. option3", "D. option4"]
        }
      ]
    }
  ],
  "answerKey": ["A. option1", "Short answer for Q2", ...]
}`;
}

async function callGroqOnce(
  assignment: IAssignment,
  extractedContent: string | null
): Promise<GeneratedPaperData> {
  const groq = getGroq();
  const userPrompt = buildUserPrompt(assignment, extractedContent);
  const systemPrompt = buildSystemPrompt();

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.65,
    max_tokens: 6000,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq");

  let parsed: GeneratedPaperData;
  try {
    parsed = JSON.parse(raw) as GeneratedPaperData;
  } catch {
    throw new Error("AI returned malformed JSON");
  }

  if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error("AI returned invalid paper structure");
  }

  return parsed;
}

export async function generatePaper(assignment: IAssignment, fileUrl?: string): Promise<GeneratedPaperData> {
  const extractedContent = fileUrl ? await extractTextFromFile(fileUrl) : null;

  let parsed: GeneratedPaperData;
  try {
    parsed = await callGroqOnce(assignment, extractedContent);
  } catch (firstErr) {
    console.warn("First AI attempt failed, retrying once:", (firstErr as Error).message);
    try {
      parsed = await callGroqOnce(assignment, extractedContent);
    } catch (secondErr) {
      throw new Error(
        `AI generation failed after 2 attempts: ${(secondErr as Error).message}`
      );
    }
  }

  // Ensure all questions have sequential numbering
  let questionNumber = 1;
  for (const section of parsed.sections) {
    for (const question of section.questions) {
      question.number = questionNumber++;
    }
  }

  // Verify answer key length matches question count
  const totalQuestions = parsed.sections.reduce((sum, s) => sum + s.questions.length, 0);
  if (!parsed.answerKey || parsed.answerKey.length !== totalQuestions) {
    // Pad or trim answer key if needed
    const existing = parsed.answerKey ?? [];
    parsed.answerKey = Array.from({ length: totalQuestions }, (_, i) =>
      existing[i] ?? "Refer to textbook"
    );
  }

  if (!parsed.message) {
    parsed.message = `Here is your customized question paper for ${parsed.subject} – ${parsed.className}. The paper has been generated based on your specifications.`;
  }

  if (!parsed.timeAllowed) {
    parsed.timeAllowed = inferTimeAllowed(parsed.maxMarks);
  }

  return parsed;
}
