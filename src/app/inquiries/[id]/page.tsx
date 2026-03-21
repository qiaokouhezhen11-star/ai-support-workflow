import Link from "next/link";
import { notFound } from "next/navigation";
import InquiryDetail from "@/components/InquiryDetail";
import {
  buildHistoryKnowledgeCandidates,
  buildKnowledgeSuggestions,
  buildManualKnowledgeSuggestions,
  buildSimilarInquiryCandidates,
} from "@/lib/inquiryInsights";
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
    include: {
      tags: {
        orderBy: {
          createdAt: "asc",
        },
      },
      auditLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  const knowledgeArticles = await prisma.knowledgeArticle.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    take: 20,
  });
  const replyTemplates = await prisma.replyTemplate.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    take: 12,
  });

  if (!inquiry) {
    notFound();
  }

  const relatedInquiries = await prisma.inquiry.findMany({
    where: {
      id: {
        not: id,
      },
    },
    include: {
      tags: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    take: 12,
    orderBy: {
      updatedAt: "desc",
    },
  });

  const { _count, auditLogs, tags, ...item } = inquiry;
  const similarInquiries = buildSimilarInquiryCandidates(inquiry, relatedInquiries);
  const knowledgeSuggestions = [
    ...buildKnowledgeSuggestions(inquiry),
    ...buildManualKnowledgeSuggestions(
      inquiry,
      knowledgeArticles.map((article) => ({
        ...article,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      }))
    ),
    ...buildHistoryKnowledgeCandidates(similarInquiries),
  ].slice(0, 5);

  const serialized: Inquiry = {
    ...item,
    slaDueAt: item.slaDueAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    auditLogs: auditLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
    commentCount: _count.comments,
    tags: tags.map((tag) => tag.name),
    similarInquiries,
    knowledgeSuggestions,
    knowledgeArticles: knowledgeArticles.map((article) => ({
      ...article,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    })),
    replyTemplates: replyTemplates.map((template) => ({
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    })),
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
