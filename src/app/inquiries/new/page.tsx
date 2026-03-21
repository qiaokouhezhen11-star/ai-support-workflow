import Link from "next/link";
import InquiryForm from "@/components/InquiryForm";
import { prisma } from "@/lib/prisma";
import type { DuplicateCheckInquiry } from "@/types/inquiry";

export default async function NewInquiryPage() {
  const inquiries = await prisma.inquiry.findMany({
    include: {
      tags: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 20,
  });

  const existingInquiries: DuplicateCheckInquiry[] = inquiries.map((item) => ({
    id: item.id,
    title: item.title,
    customerName: item.customerName,
    inquiryBody: item.inquiryBody,
    category: item.category,
    priority: item.priority,
    summary: item.summary,
    draftReply: item.draftReply,
    status: item.status,
    updatedAt: item.updatedAt.toISOString(),
    tags: item.tags.map((tag) => tag.name),
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">新規登録</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              問い合わせを登録
            </h1>
          </div>

          <Link
            href="/inquiries"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            一覧へ戻る
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <InquiryForm existingInquiries={existingInquiries} />
        </div>
      </div>
    </main>
  );
}
