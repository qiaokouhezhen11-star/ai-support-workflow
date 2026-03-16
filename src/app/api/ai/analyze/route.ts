import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";

const analyzeSchema = z.object({
  inquiryId: z.string().min(1),
});

const aiResultSchema = z.object({
  category: z.enum([
    "GENERAL",
    "TROUBLESHOOTING",
    "BILLING",
    "FEATURE_REQUEST",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  summary: z.string(),
  draftReply: z.string(),
  aiReason: z.string(),
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY が設定されていません。" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsed = analyzeSchema.parse(body);

    const inquiry = await prisma.inquiry.findUnique({
      where: {
        id: parsed.inquiryId,
      },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "問い合わせが見つかりません。" },
        { status: 404 }
      );
    }

    const prompt = `
あなたは優秀なカスタマーサポート支援AIです。
問い合わせ本文を読み、カテゴリ、優先度、要約、回答案、判定理由を作成してください。

カテゴリ候補:
GENERAL / TROUBLESHOOTING / BILLING / FEATURE_REQUEST / OTHER

優先度候補:
LOW / MEDIUM / HIGH / URGENT

回答案は、担当者がたたき台として使える丁寧な日本語で作成してください。

問い合わせ本文:
${inquiry.inquiryBody}
    `.trim();

    const response = await openai.responses.parse({
      model: "gpt-4.1-mini",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "inquiry_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: {
                type: "string",
                enum: [
                  "GENERAL",
                  "TROUBLESHOOTING",
                  "BILLING",
                  "FEATURE_REQUEST",
                  "OTHER",
                ],
              },
              priority: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
              },
              summary: {
                type: "string",
              },
              draftReply: {
                type: "string",
              },
              aiReason: {
                type: "string",
              },
            },
            required: [
              "category",
              "priority",
              "summary",
              "draftReply",
              "aiReason",
            ],
          },
        },
      },
    });

    const parsedOutput = aiResultSchema.parse(response.output_parsed);

    const updated = await prisma.inquiry.update({
      where: {
        id: inquiry.id,
      },
      data: {
        category: parsedOutput.category,
        priority: parsedOutput.priority,
        summary: parsedOutput.summary,
        draftReply: parsedOutput.draftReply,
        aiReason: parsedOutput.aiReason,
        status: "AI_DRAFTED",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "AI解析に失敗しました。" },
      { status: 500 }
    );
  }
}