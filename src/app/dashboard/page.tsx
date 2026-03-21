import Link from "next/link";
import DashboardCharts from "@/components/DashboardCharts";
import KnowledgeLibraryPanel from "@/components/KnowledgeLibraryPanel";
import ReplyTemplateLibraryPanel from "@/components/ReplyTemplateLibraryPanel";
import { prisma } from "@/lib/prisma";
import { getStatusLabel } from "@/lib/inquiryLabels";
import { getAuditActionLabel } from "@/lib/auditLogs";
import { getSlaMeta } from "@/lib/sla";

function percent(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString("ja-JP");
}

function formatDuration(hours: number) {
  if (hours <= 0) {
    return "0時間";
  }

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${minutes}分`;
  }

  if (minutes === 0) {
    return `${wholeHours}時間`;
  }

  return `${wholeHours}時間 ${minutes}分`;
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const [
    total,
    openCount,
    aiDraftedCount,
    reviewNeededCount,
    completedCount,
    urgentCount,
    assignedCount,
    commentCount,
    inquiries,
    recentLogs,
    recentAiEvaluations,
    knowledgeArticles,
    replyTemplates,
  ] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "OPEN" } }),
    prisma.inquiry.count({ where: { status: "AI_DRAFTED" } }),
    prisma.inquiry.count({ where: { status: "REVIEW_NEEDED" } }),
    prisma.inquiry.count({ where: { status: "COMPLETED" } }),
    prisma.inquiry.count({ where: { priority: "URGENT" } }),
    prisma.inquiry.count({ where: { assigneeName: { not: null } } }),
    prisma.inquiryComment.count(),
    prisma.inquiry.findMany({
      include: {
        _count: {
          select: {
            comments: true,
          },
        },
        auditLogs: {
          where: {
            action: "STATUS_UPDATED",
            afterValue: "COMPLETED",
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.inquiryAuditLog.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        inquiry: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    }),
    prisma.aiEvaluationLog.findMany({
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        inquiry: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.knowledgeArticle.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
    }),
    prisma.replyTemplate.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
    }),
  ]);

  const assigneeLoad = Object.entries(
    inquiries.reduce<Record<string, number>>((acc, inquiry) => {
      const key = inquiry.assigneeName ?? "未割り当て";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const priorityDistribution = [
    {
      label: "緊急",
      value: inquiries.filter((item) => item.priority === "URGENT").length,
      barClass: "bg-red-500",
    },
    {
      label: "高",
      value: inquiries.filter((item) => item.priority === "HIGH").length,
      barClass: "bg-orange-500",
    },
    {
      label: "中",
      value: inquiries.filter((item) => item.priority === "MEDIUM").length,
      barClass: "bg-blue-500",
    },
    {
      label: "低",
      value: inquiries.filter((item) => item.priority === "LOW").length,
      barClass: "bg-slate-500",
    },
  ];

  const statusItems = [
    { label: "未対応", value: openCount },
    { label: "AI下書き済み", value: aiDraftedCount },
    { label: "確認中", value: reviewNeededCount },
    { label: "完了", value: completedCount },
  ];

  const categoryItems = [
    {
      label: "請求",
      value: inquiries.filter((item) => item.category === "BILLING").length,
      colorClass: "bg-emerald-500",
    },
    {
      label: "不具合",
      value: inquiries.filter((item) => item.category === "TROUBLESHOOTING").length,
      colorClass: "bg-sky-500",
    },
    {
      label: "機能要望",
      value: inquiries.filter((item) => item.category === "FEATURE_REQUEST").length,
      colorClass: "bg-violet-500",
    },
    {
      label: "一般 / その他",
      value: inquiries.filter(
        (item) => item.category === "GENERAL" || item.category === "OTHER" || item.category === null
      ).length,
      colorClass: "bg-slate-500",
    },
  ];

  const today = new Date();
  const intakeTrend = Array.from({ length: 7 }, (_, index) => {
    const targetDate = new Date(today);
    targetDate.setHours(0, 0, 0, 0);
    targetDate.setDate(today.getDate() - (6 - index));
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    return {
      label: dayLabel(targetDate),
      value: inquiries.filter((item) => item.createdAt >= targetDate && item.createdAt < nextDate).length,
    };
  });

  const completionRate = percent(completedCount, total);
  const assignmentRate = percent(assignedCount, total);
  const avgComments = total === 0 ? 0 : Math.round((commentCount / total) * 10) / 10;
  const aiAcceptedCount = recentAiEvaluations.filter((item) => item.result === "ACCEPTED").length;
  const aiEditedCount = recentAiEvaluations.filter((item) => item.result === "EDITED").length;
  const aiRejectedCount = recentAiEvaluations.filter((item) => item.result === "REJECTED").length;
  const overdueCount = inquiries.filter((item) =>
    getSlaMeta({
      slaDueAt: item.slaDueAt?.toISOString() ?? null,
      status: item.status,
    }).isOverdue
  ).length;
  const dueSoonCount = inquiries.filter((item) =>
    getSlaMeta({
      slaDueAt: item.slaDueAt?.toISOString() ?? null,
      status: item.status,
    }).isDueSoon
  ).length;
  const assigneeProcessingTime = Object.entries(
    inquiries.reduce<Record<string, { totalHours: number; count: number }>>((acc, inquiry) => {
      const completedAt = inquiry.auditLogs[0]?.createdAt;

      if (!completedAt) {
        return acc;
      }

      const key = inquiry.assigneeName ?? "未割り当て";
      const durationHours =
        (completedAt.getTime() - inquiry.createdAt.getTime()) / (1000 * 60 * 60);

      if (durationHours < 0) {
        return acc;
      }

      acc[key] ??= { totalHours: 0, count: 0 };
      acc[key].totalHours += durationHours;
      acc[key].count += 1;
      return acc;
    }, {})
  )
    .map(([label, value]) => ({
      label,
      count: value.count,
      avgHours: value.totalHours / value.count,
    }))
    .sort((a, b) => a.avgHours - b.avgHours);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">ダッシュボード</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                問い合わせ対応の全体状況
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                いま何件あるか、どの担当者に偏っているか、どの更新が最近起きたかをまとめて確認できます。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/inquiries"
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500"
              >
                問い合わせ一覧
              </Link>
              <Link
                href="/inquiries/new"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                新規登録
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "総問い合わせ数",
              value: `${total}件`,
              note: "現在管理中の件数",
              subValue: `完了率 ${completionRate}%`,
              className: "from-slate-50 to-white",
            },
            {
              label: "担当者設定済み",
              value: `${assignedCount}件`,
              note: "割り当て済みの件数",
              subValue: `割り当て率 ${assignmentRate}%`,
              className: "from-violet-50 to-white",
            },
            {
              label: "緊急対応",
              value: `${urgentCount}件`,
              note: "優先度が緊急",
              subValue: `未対応 ${openCount}件`,
              className: "from-red-50 to-white",
            },
            {
              label: "SLA注意件数",
              value: `${overdueCount + dueSoonCount}件`,
              note: "遅延中または期限が近い件数",
              subValue: `遅延 ${overdueCount}件 / 期限接近 ${dueSoonCount}件`,
              className: "from-amber-50 to-white",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-5 shadow-sm ${item.className}`}
            >
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                {item.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{item.subValue}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
            </div>
          ))}
        </section>

        <DashboardCharts
          categoryItems={categoryItems}
          intakeTrend={intakeTrend}
          total={total}
        />

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">ステータスの内訳</h2>
                <p className="mt-1 text-sm text-slate-500">
                  どの状態に案件がたまっているかを確認できます。
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Updated Summary
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {statusItems.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="text-slate-500">
                      {item.value} 件 / {percent(item.value, total)}%
                    </span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-slate-900"
                      style={{ width: `${percent(item.value, total)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">優先度の内訳</h2>
            <p className="mt-1 text-sm text-slate-500">
              緊急対応が増えていないかをざっくり把握できます。
            </p>

            <div className="mt-6 space-y-4">
              {priorityDistribution.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="text-slate-500">{item.value} 件</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100">
                    <div
                      className={`h-3 rounded-full ${item.barClass}`}
                      style={{ width: `${percent(item.value, total)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">担当者ごとの件数</h2>
            <p className="mt-1 text-sm text-slate-500">
              誰に問い合わせが偏っているかを確認できます。
            </p>

            <div className="mt-6 space-y-4">
              {assigneeLoad.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-800">{label}</p>
                    <p className="text-sm text-slate-500">{value} 件</p>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-white">
                    <div
                      className="h-2.5 rounded-full bg-blue-600"
                      style={{ width: `${percent(value, total)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">担当者別の平均処理時間</h2>
            <p className="mt-1 text-sm text-slate-500">
              登録から完了までの時間を、担当者ごとに平均で見られます。
            </p>

            {assigneeProcessingTime.length > 0 ? (
              <div className="mt-6 space-y-4">
                {assigneeProcessingTime.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{item.label}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          完了案件 {item.count} 件の平均
                        </p>
                      </div>
                      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                          Average Lead Time
                        </p>
                        <p className="mt-1 text-lg font-bold text-cyan-950">
                          {formatDuration(item.avgHours)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
                <p className="text-sm font-semibold text-slate-700">
                  まだ完了案件が少ないため、処理時間を集計できません。
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  ステータスが完了になった問い合わせが増えると、担当者ごとの平均時間がここに表示されます。
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">AI評価ログ</h2>
            <p className="mt-1 text-sm text-slate-500">
              AI回答案がどれくらい使えたかを、最近の評価から確認できます。
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">そのまま採用</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-950">
                  {aiAcceptedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-700">修正して利用</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-amber-950">
                  {aiEditedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-700">採用しない</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-rose-950">
                  {aiRejectedCount}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {recentAiEvaluations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
                  <p className="text-sm font-semibold text-slate-700">
                    まだAI評価ログはありません。
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    問い合わせ詳細のAI結果欄から、評価を追加できるようにしています。
                  </p>
                </div>
              ) : (
                recentAiEvaluations.map((item) => {
                  const label =
                    item.result === "ACCEPTED"
                      ? "そのまま採用"
                      : item.result === "EDITED"
                        ? "修正して利用"
                        : "採用しない";

                  const toneClass =
                    item.result === "ACCEPTED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : item.result === "EDITED"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-rose-200 bg-rose-50 text-rose-700";

                  return (
                    <Link
                      key={item.id}
                      href={`/inquiries/${item.inquiry.id}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}
                        >
                          {label}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {item.evaluatedBy}
                        </span>
                      </div>
                      <p className="mt-3 font-semibold text-slate-900">{item.inquiry.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.memo ?? "メモなし"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">SLAアラート</h2>
            <p className="mt-1 text-sm text-slate-500">
              期限超過と、まもなく期限を迎える問い合わせをまとめて確認できます。
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-700">期限超過</p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-red-950">
                  {overdueCount}
                </p>
                <p className="mt-2 text-sm text-red-700">
                  すぐ確認したい遅延案件です。
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-700">まもなく期限</p>
                <p className="mt-3 text-4xl font-bold tracking-tight text-amber-950">
                  {dueSoonCount}
                </p>
                <p className="mt-2 text-sm text-amber-700">
                  遅延前にフォローしたい案件です。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">社内メモの活用状況</h2>
            <p className="mt-1 text-sm text-slate-500">
              引き継ぎに使われるメモの量をざっくり把握できます。
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">社内メモ総数</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                {commentCount}件
              </p>
              <p className="mt-2 text-sm text-slate-500">
                平均 {avgComments}件 / 問い合わせ
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">最近の更新</h2>
            <p className="mt-1 text-sm text-slate-500">
              直近の監査ログをダッシュボードから確認できます。
            </p>

            <div className="mt-6 space-y-4">
              {recentLogs.map((log) => (
                <Link
                  key={log.id}
                  href={`/inquiries/${log.inquiry.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {log.actorName}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {getAuditActionLabel(log.action)}
                    </span>
                    {log.fieldName ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {log.fieldName}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 font-semibold text-slate-900">{log.inquiry.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {log.comment ?? `${getStatusLabel(log.inquiry.status)} の問い合わせで更新がありました。`}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">直近の問い合わせ一覧</h2>
            <p className="mt-1 text-sm text-slate-500">
              ダッシュボードから最近更新された案件へすぐ移動できます。
            </p>

            <div className="mt-6 space-y-4">
              {inquiries.slice(0, 5).map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/inquiries/${inquiry.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {getStatusLabel(inquiry.status)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      担当: {inquiry.assigneeName ?? "未割り当て"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                      コメント {inquiry._count.comments} 件
                    </span>
                  </div>
                  <p className="mt-3 font-semibold text-slate-900">{inquiry.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{inquiry.customerName}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    最終更新 {formatDate(inquiry.updatedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <KnowledgeLibraryPanel
          articles={knowledgeArticles.map((article) => ({
            ...article,
            createdAt: article.createdAt.toISOString(),
            updatedAt: article.updatedAt.toISOString(),
          }))}
        />

        <ReplyTemplateLibraryPanel
          templates={replyTemplates.map((template) => ({
            ...template,
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
