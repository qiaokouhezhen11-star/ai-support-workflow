import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const createAiEvaluationSchema = z.object({
  result: z.enum(["ACCEPTED", "EDITED", "REJECTED"]),
  memo: z.string().trim().max(300).nullable().optional(),
  evaluatedBy: z.string().trim().max(50).optional(),
});

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function getResultComment(result: "ACCEPTED" | "EDITED" | "REJECTED") {
  switch (result) {
    case "ACCEPTED":
      return "AI回答案をそのまま採用しました。";
    case "EDITED":
      return "AI回答案を修正して利用しました。";
    case "REJECTED":
      return "AI回答案を採用せず差し替えました。";
    default:
      return "AI評価ログを追加しました。";
  }
}

export async function POST(req: Request, { params }: Props) {
  try {
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const permission = await requirePermission("logAiEvaluation");
    if (permission.response) {
      return permission.response;
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = createAiEvaluationSchema.parse(body);

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { id: true, assigneeName: true },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "問い合わせが見つかりません。" },
        { status: 404 }
      );
    }

    const actorName = parsed.evaluatedBy || inquiry.assigneeName || "担当者";

    const evaluation = await prisma.$transaction(async (tx) => {
      const created = await tx.aiEvaluationLog.create({
        data: {
          inquiryId: id,
          result: parsed.result,
          memo: parsed.memo ?? null,
          evaluatedBy: actorName,
        },
      });

      await tx.inquiryAuditLog.create({
        data: {
          inquiryId: id,
          action: "FIELD_UPDATED",
          actorName,
          fieldName: "aiEvaluation",
          beforeValue: null,
          afterValue: parsed.result,
          comment: parsed.memo
            ? `${getResultComment(parsed.result)} ${parsed.memo}`
            : getResultComment(parsed.result),
        },
      });

      return created;
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "入力値が不正です。" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "AI評価ログの保存に失敗しました。" },
      { status: 500 }
    );
  }
}
