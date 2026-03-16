import Link from "next/link";
import { notFound } from "next/navigation";
import InquiryDetail from "@/components/InquiryDetail";
import { prisma } from "@/lib/prisma";
import type { Inquiry } from "@/types/inquiry";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InquiryDetailPage({ params }: Props) {
  const { id } = await params;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
  });

  if (!inquiry) {
    notFound();
  }

  const serialized: Inquiry = {
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">詳細画面</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              問い合わせ詳細
            </h1>
          </div>

          <Link
            href="/inquiries"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            一覧へ戻る
          </Link>
        </div>

        <InquiryDetail inquiry={serialized} />
      </div>
    </main>
  );
}