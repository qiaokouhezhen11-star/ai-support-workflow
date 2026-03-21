import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const knowledgeSchema = z.object({
  title: z.string().trim().min(1, "タイトルは必須です。").max(80),
  summary: z.string().trim().min(1, "要点は必須です。").max(200),
  content: z.string().trim().min(1, "本文は必須です。").max(2000),
  category: z
    .enum(["GENERAL", "TROUBLESHOOTING", "BILLING", "FEATURE_REQUEST", "OTHER"])
    .nullable()
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(20)).max(8).optional(),
  keywords: z.array(z.string().trim().min(1).max(20)).max(8).optional(),
  createdBy: z.string().trim().max(50).optional(),
});

function normalizeList(values: string[] | undefined) {
  if (!values || values.length === 0) {
    return null;
  }

  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean))).join(", ");
}

export async function POST(req: Request) {
  try {
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const permission = await requirePermission("manageKnowledge");
    if (permission.response) {
      return permission.response;
    }

    const body = await req.json();
    const parsed = knowledgeSchema.parse(body);

    const article = await prisma.knowledgeArticle.create({
      data: {
        title: parsed.title,
        summary: parsed.summary,
        content: parsed.content,
        category: parsed.category ?? null,
        priority: parsed.priority ?? null,
        tagsText: normalizeList(parsed.tags),
        keywordsText: normalizeList(parsed.keywords),
        createdBy: parsed.createdBy?.trim() || "担当者",
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "入力値が不正です。" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "ナレッジの登録に失敗しました。" },
      { status: 500 }
    );
  }
}
