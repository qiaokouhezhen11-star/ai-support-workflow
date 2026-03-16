import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateInquirySchema = z.object({
  title: z.string().optional(),
  customerName: z.string().optional(),
  inquiryBody: z.string().optional(),
  category: z
    .enum(["GENERAL", "TROUBLESHOOTING", "BILLING", "FEATURE_REQUEST", "OTHER"])
    .nullable()
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).nullable().optional(),
  summary: z.string().nullable().optional(),
  draftReply: z.string().nullable().optional(),
  aiReason: z.string().nullable().optional(),
  status: z.enum(["OPEN", "AI_DRAFTED", "REVIEW_NEEDED", "COMPLETED"]).optional(),
});

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: Props) {
  try {
    const { id } = await params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "問い合わせが見つかりません。" },
        { status: 404 }
      );
    }

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "問い合わせの取得に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateInquirySchema.parse(body);

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: parsed,
    });

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "入力値が不正です。" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "問い合わせの更新に失敗しました。" },
      { status: 500 }
    );
  }
}