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
  }>;
};

export default async function InquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const keyword = params.keyword?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const priority = params.priority?.trim() ?? "";

  const where = {
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword } },
            { customerName: { contains: keyword } },
            { inquiryBody: { contains: keyword } },
          ],
        }
      : {}),
    ...(status ? { status: status as InquiryStatus } : {}),
    ...(priority ? { priority: priority as InquiryPriority } : {}),
  };

  const [inquiries, total, openCount, aiDraftedCount, completedCount] =
    await Promise.all([
      prisma.inquiry.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: "OPEN" } }),
      prisma.inquiry.count({ where: { status: "AI_DRAFTED" } }),
      prisma.inquiry.count({ where: { status: "COMPLETED" } }),
    ]);

  const serialized: Inquiry[] = inquiries.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">問い合わせ一覧</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              AI問い合わせ対応支援アプリ
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              ホームへ
            </Link>
            <Link
              href="/inquiries/new"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              新規登録
            </Link>
          </div>
        </div>

        <StatsCards
          total={total}
          openCount={openCount}
          aiDraftedCount={aiDraftedCount}
          completedCount={completedCount}
        />

        <InquiryFilters />

        <InquiryList inquiries={serialized} />
      </div>
    </main>
  );
}