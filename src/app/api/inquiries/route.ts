import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const createInquirySchema = z.object({
  title: z.string().trim().min(1, "件名は必須です。"),
  customerName: z.string().trim().min(1, "顧客名は必須です。"),
  inquiryBody: z.string().trim().min(1, "問い合わせ本文は必須です。"),
});

export async function GET() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(inquiries);
}

export async function POST(req: Request) {
  try {
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const permission = await requirePermission("createInquiry");
    if (permission.response) {
      return permission.response;
    }

    const body = await req.json();
    const parsed = createInquirySchema.parse(body);

    const inquiry = await prisma.$transaction(async (tx) => {
      const created = await tx.inquiry.create({
        data: {
          title: parsed.title,
          customerName: parsed.customerName,
          inquiryBody: parsed.inquiryBody,
        },
      });

      await tx.inquiryAuditLog.create({
        data: {
          inquiryId: created.id,
          action: "CREATED",
          actorName: "システム",
          comment: "問い合わせが新規登録されました。",
        },
      });

      return created;
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "入力値が不正です。",
        },
        { status: 400 }
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "問い合わせの作成に失敗しました。" },
      { status: 500 }
    );
  }
}
