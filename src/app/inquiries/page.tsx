import Link from "next/link";
import InquiryFilters from "@/components/InquiryFilters";
import InquiryList from "@/components/InquiryList";
import StatsCards from "@/components/StatsCards";
import { prisma } from "@/lib/prisma";
import type { Inquiry, InquiryPriority, InquiryStatus } from "@/types/inquiry";

type PageProps = {
  searchParams: Promise<{
    keyword?: string;
    status?: string;
    priority?: string;
    assignee?: string;
  }>;
};

export default async function InquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const keyword = params.keyword?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const priority = params.priority?.trim() ?? "";
  const assignee = params.assignee?.trim() ?? "";

  const where = {
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword } },
            { customerName: { contains: keyword } },
            { inquiryBody: { contains: keyword } },
            { assigneeName: { contains: keyword } },
          ],
        }
      : {}),
    ...(status ? { status: status as InquiryStatus } : {}),
    ...(priority ? { priority: priority as InquiryPriority } : {}),
    ...(assignee === "__unassigned__"
      ? { assigneeName: null }
      : assignee
        ? { assigneeName: assignee }
        : {}),
  };

  const [inquiries, total, openCount, aiDraftedCount, completedCount, assignedCount, assigneeRows] =
    await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          tags: {
            orderBy: {
              createdAt: "asc",
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: "OPEN" } }),
      prisma.inquiry.count({ where: { status: "AI_DRAFTED" } }),
      prisma.inquiry.count({ where: { status: "COMPLETED" } }),
      prisma.inquiry.count({ where: { assigneeName: { not: null } } }),
      prisma.inquiry.findMany({
        where: {
          assigneeName: {
            not: null,
          },
        },
        select: {
          assigneeName: true,
        },
        orderBy: {
          assigneeName: "asc",
        },
      }),
    ]);

  const assigneeOptions = Array.from(
    new Set(
      assigneeRows
        .map((item) => item.assigneeName)
        .filter((item): item is string => Boolean(item))
    )
  );

  const serialized: Inquiry[] = inquiries.map(({ _count, tags, ...item }) => ({
    ...item,
    approvalRequestedAt: item.approvalRequestedAt?.toISOString() ?? null,
    approvedAt: item.approvedAt?.toISOString() ?? null,
    slaDueAt: item.slaDueAt?.toISOString() ?? null,
    approvalComment: item.approvalComment ?? null,
    approvedBy: item.approvedBy ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    commentCount: _count.comments,
    tags: tags.map((tag) => tag.name),
  }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">問い合わせ一覧</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                AI問い合わせ対応支援アプリ
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                担当者、優先度、コメント有無をひと目で把握できる一覧にして、対応漏れを防ぎやすくしています。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                ダッシュボード
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                ホームへ
              </Link>
              <Link
                href="/inquiries/new"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
              >
                新規登録
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              並び順: 更新が新しい順
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              検索対象: 件名 / 顧客名 / 本文 / 担当者
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              担当者設定済み: {assignedCount} 件
            </span>
          </div>
        </div>

        <StatsCards
          total={total}
          openCount={openCount}
          aiDraftedCount={aiDraftedCount}
          completedCount={completedCount}
          assignedCount={assignedCount}
        />

        <InquiryFilters assigneeOptions={assigneeOptions} />

        <InquiryList inquiries={serialized} />
      </div>
    </main>
  );
}
