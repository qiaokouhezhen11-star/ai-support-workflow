import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getReadOnlyDeploymentMessage,
  isReadOnlyDeployment,
} from "@/lib/deployMode";
import { prisma } from "@/lib/prisma";

const updateInquirySchema = z.object({
  title: z.string().trim().min(1).optional(),
  customerName: z.string().trim().min(1).optional(),
  inquiryBody: z.string().trim().min(1).optional(),
  assigneeName: z.string().trim().max(50).nullable().optional(),
  category: z
    .enum(["GENERAL", "TROUBLESHOOTING", "BILLING", "FEATURE_REQUEST", "OTHER"])
    .nullable()
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).nullable().optional(),
  summary: z.string().nullable().optional(),
  draftReply: z.string().nullable().optional(),
  aiReason: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(20)).max(8).optional(),
  status: z.enum(["OPEN", "AI_DRAFTED", "REVIEW_NEEDED", "COMPLETED"]).optional(),
  actorName: z.string().trim().max(50).optional(),
});

const auditableFields = [
  "title",
  "customerName",
  "inquiryBody",
  "assigneeName",
  "category",
  "priority",
  "summary",
  "draftReply",
  "aiReason",
  "status",
] as const;

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type AuditLogInput = {
  inquiryId: string;
  action: "STATUS_UPDATED" | "ASSIGNEE_UPDATED" | "FIELD_UPDATED";
  actorName: string;
  fieldName: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  comment: string | null;
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
    if (isReadOnlyDeployment()) {
      return NextResponse.json(
        { error: getReadOnlyDeploymentMessage() },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateInquirySchema.parse(body);
    const { actorName, tags, ...data } = parsed;

    const current = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        tags: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!current) {
      return NextResponse.json(
        { error: "問い合わせが見つかりません。" },
        { status: 404 }
      );
    }

    const logs = auditableFields.reduce<AuditLogInput[]>((acc, field) => {
      if (!(field in data)) {
        return acc;
      }

        const beforeValue = stringifyValue(current[field]);
        const afterValue = stringifyValue(data[field]);

        if (beforeValue === afterValue) {
          return acc;
        }

        const isStatus = field === "status";
        const isAssignee = field === "assigneeName";

        acc.push({
          inquiryId: id,
          action: isStatus
            ? "STATUS_UPDATED"
            : isAssignee
              ? "ASSIGNEE_UPDATED"
              : "FIELD_UPDATED",
          actorName: actorName || current.assigneeName || "担当者",
          fieldName: field,
          beforeValue,
          afterValue,
          comment: isStatus
            ? "ステータスが更新されました。"
            : isAssignee
              ? "担当者が更新されました。"
              : `${field} が更新されました。`,
        });

        return acc;
      }, []);

    const nextTags = tags
      ? Array.from(
          new Set(
            tags
              .map((item) => item.trim())
              .filter(Boolean)
          )
        )
      : undefined;

    const currentTags = current.tags.map((item) => item.name);

    if (nextTags) {
      const beforeValue = stringifyValue(currentTags.join(", "));
      const afterValue = stringifyValue(nextTags.join(", "));

      if (beforeValue !== afterValue) {
        logs.push({
          inquiryId: id,
          action: "FIELD_UPDATED",
          actorName: actorName || current.assigneeName || "担当者",
          fieldName: "tags",
          beforeValue,
          afterValue,
          comment: "タグが更新されました。",
        });
      }
    }

    const inquiry = await prisma.$transaction(async (tx) => {
      const updated = await tx.inquiry.update({
        where: { id },
        data,
      });

      if (nextTags) {
        await tx.inquiryTag.deleteMany({
          where: { inquiryId: id },
        });

        if (nextTags.length > 0) {
          await tx.inquiryTag.createMany({
            data: nextTags.map((name) => ({
              inquiryId: id,
              name,
            })),
          });
        }
      }

      if (logs.length > 0) {
        await tx.inquiryAuditLog.createMany({
          data: logs,
        });
      }

      return updated;
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
