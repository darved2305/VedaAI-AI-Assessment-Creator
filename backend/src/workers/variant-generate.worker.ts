import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";
import archiver from "archiver";
import QRCode from "qrcode";
import { Readable } from "stream";
import { broadcast } from "../websocket/wsManager";
import { generateAllVariants } from "../lib/variant-engine";
import type { VariantGenerateJob } from "../types/jobs";
import type { PaperVariant } from "../types/domain";

export const VARIANT_JOB_NAME = "generate-variants";
export const VARIANT_QUEUE_NAME = "variant-generation";

let variantQueue: Queue | null = null;

function getVariantQueue(): Queue {
  if (!variantQueue) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not defined");
    const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
    variantQueue = new Queue(VARIANT_QUEUE_NAME, { connection });
  }
  return variantQueue;
}

async function buildVariantHTML(
  variant: PaperVariant,
  paperMeta: { schoolName: string; subject: string; className: string; timeAllowed: string; maxMarks: number },
  qrDataUrl: string | null
): Promise<string> {
  const sectionsHtml = variant.sections
    .map((section) => {
      const questionsHtml = section.questions
        .map((q) => {
          const optionsHtml =
            q.options && q.options.length > 0
              ? `<ol style="margin:4px 0 0 20px;">${q.options.map((o) => `<li>${o}</li>`).join("")}</ol>`
              : "";
          return `<li style="margin-bottom:8px;"><strong>${q.number}.</strong> ${q.text}${optionsHtml} <em>[${q.marks} mark${q.marks > 1 ? "s" : ""}]</em></li>`;
        })
        .join("");
      return `<div style="margin-bottom:20px;"><h3 style="text-align:center;">${section.label}</h3><p style="font-style:italic;">${section.instruction.replace("\n", "<br/>")}</p><ol style="list-style:none;padding:0;">${questionsHtml}</ol></div>`;
    })
    .join("");

  const qrHtml = qrDataUrl
    ? `<img src="${qrDataUrl}" style="position:absolute;top:20px;right:20px;width:80px;height:80px;" alt="QR" />`
    : "";

  return `<!DOCTYPE html><html><head><style>
    body { font-family: 'Times New Roman', serif; font-size: 13px; padding: 40px; position: relative; }
    h1,h2,h3 { text-align: center; }
  </style></head><body>
    ${qrHtml}
    <h2>${paperMeta.schoolName}</h2>
    <div style="background:#1a1a2e;color:white;padding:6px 12px;text-align:center;border-radius:4px;display:inline-block;margin-bottom:12px;">
      Variant ${variant.label}
    </div>
    <p style="text-align:center;">Subject: ${paperMeta.subject} | Class: ${paperMeta.className}</p>
    <div style="display:flex;justify-content:space-between;border-top:2px solid #333;border-bottom:2px solid #333;padding:6px 0;margin-bottom:16px;">
      <span>Time: ${paperMeta.timeAllowed}</span>
      <span>Max Marks: ${paperMeta.maxMarks}</span>
    </div>
    ${sectionsHtml}
  </body></html>`;
}

export function startVariantWorker(): Worker {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not defined");

  const connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });

  const worker = new Worker(
    VARIANT_QUEUE_NAME,
    async (job) => {
      if (job.name !== VARIANT_JOB_NAME) return;

      const data = job.data as VariantGenerateJob & {
        paperMeta: { schoolName: string; subject: string; className: string; timeAllowed: string; maxMarks: number };
      };
      const { assignmentId, jobId, originalPaper, config, paperMeta } = data;

      broadcast({ type: "VARIANT_PROGRESS", assignmentId, jobId, completed: 0, total: config.count });

      const variants = generateAllVariants(assignmentId, originalPaper.sections, config);

      const enrichedVariants: PaperVariant[] = [];

      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        let qrDataUrl: string | null = null;

        if (variant.qrPayload) {
          try {
            qrDataUrl = await QRCode.toDataURL(variant.qrPayload);
          } catch {
            // non-fatal
          }
        }

        enrichedVariants.push({ ...variant, qrPayload: qrDataUrl ?? variant.qrPayload });

        broadcast({
          type: "VARIANT_PROGRESS",
          assignmentId,
          jobId,
          completed: i + 1,
          total: config.count,
        });
      }

      let zipBase64: string | null = null;
      try {
        const puppeteer = await import("puppeteer");
        const browser = await puppeteer.default.launch({ headless: true, args: ["--no-sandbox"] });

        const pdfBuffers: { label: string; buffer: Buffer }[] = [];

        for (const variant of enrichedVariants) {
          const html = await buildVariantHTML(
            variant,
            paperMeta,
            variant.qrPayload
          );
          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: "load" });
          const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
          pdfBuffers.push({ label: variant.label, buffer: Buffer.from(pdfBuffer) });
          await page.close();
        }

        await browser.close();

        zipBase64 = await new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          const archive = archiver("zip");

          archive.on("data", (chunk) => chunks.push(chunk as Buffer));
          archive.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
          archive.on("error", reject);

          for (const { label, buffer } of pdfBuffers) {
            archive.append(Readable.from(buffer), { name: `Variant_${label}.pdf` });
          }

          archive.finalize();
        });
      } catch (err) {
        console.warn("PDF generation skipped (puppeteer unavailable):", (err as Error).message);
      }

      broadcast({
        type: "VARIANT_DONE",
        assignmentId,
        jobId,
        variants: enrichedVariants.map((v) => ({
          ...v,
          zipBase64: zipBase64 ?? undefined,
        })) as PaperVariant[],
      });
    },
    { connection, concurrency: 2 }
  );

  worker.on("failed", (job, err) => {
    if (!job) return;
    const data = job.data as VariantGenerateJob;
    broadcast({
      type: "VARIANT_ERROR",
      assignmentId: data.assignmentId,
      jobId: data.jobId,
      error: err.message,
    });
  });

  console.log("Variant generation worker started");
  return worker;
}

export async function enqueueVariantGeneration(
  params: Omit<VariantGenerateJob, "jobId"> & {
    paperMeta: { schoolName: string; subject: string; className: string; timeAllowed: string; maxMarks: number };
  }
): Promise<string> {
  const jobId = new mongoose.Types.ObjectId().toString();
  const queue = getVariantQueue();
  await queue.add(VARIANT_JOB_NAME, { ...params, jobId }, {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
  });
  return jobId;
}
